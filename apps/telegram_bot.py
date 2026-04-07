import json
import os
import time
import traceback
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Optional

from redis import Redis
from rq import Queue
from rq.job import Job

from tasks import run_job

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
QUEUE_NAME = os.getenv("RQ_QUEUE", "jobs")
JOB_TIMEOUT = int(os.getenv("JOB_TIMEOUT", "1800"))
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
BOT_POLL_TIMEOUT = int(os.getenv("BOT_POLL_TIMEOUT", "20"))
BOT_ALLOWED_CHAT_IDS = {
    chat_id.strip() for chat_id in os.getenv("TELEGRAM_ALLOWED_CHAT_IDS", "").split(",") if chat_id.strip()
}

TELEGRAM_API_BASE = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"
REDIS_UPDATE_OFFSET_KEY = "telegram:update_offset"
REDIS_PENDING_JOBS_KEY = "telegram:pending_jobs"
REDIS_JOB_PREFIX = "telegram:job:"
REDIS_CHAT_JOBS_PREFIX = "telegram:chat_jobs:"
REDIS_CREDITS_PREFIX = "telegram:credits:"
REDIS_USER_PREFIX = "telegram:user:"
REDIS_REFERRAL_PREFIX = "telegram:referral:"
TELEGRAM_MESSAGE_LIMIT = 3900
RECENT_JOB_LIMIT = 20

# Credit policy
CREDITS_PER_RUN = 10
CREDITS_NEW_USER = 50
CREDITS_REFERRAL_BONUS = 30  # awarded to referrer on referree's first run
CREDITS_PER_STAR = 10

# Star packages: (label, stars, credits)
STAR_PACKAGES = [
    ("starter", 10, 100),
    ("basic", 50, 500),
    ("pro", 100, 1000),
]


# ---------------------------------------------------------------------------
# Redis helpers
# ---------------------------------------------------------------------------

def get_redis() -> Redis:
    return Redis.from_url(REDIS_URL)


def get_queue(redis: Redis) -> Queue:
    return Queue(QUEUE_NAME, connection=redis)


def decode(value):
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    return value


# ---------------------------------------------------------------------------
# Telegram API
# ---------------------------------------------------------------------------

def telegram_request(method: str, payload: Optional[dict] = None, timeout: int = 30) -> dict:
    data = json.dumps(payload or {}).encode("utf-8")
    request = urllib.request.Request(
        f"{TELEGRAM_API_BASE}/{method}",
        data=data,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Telegram API HTTP {exc.code}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Telegram API network error: {exc.reason}") from exc

    result = json.loads(body)
    if not result.get("ok"):
        raise RuntimeError(f"Telegram API error calling {method}: {result}")
    return result


def send_message(chat_id: str, text: str, parse_mode: Optional[str] = None) -> None:
    message = text.strip()
    if len(message) > TELEGRAM_MESSAGE_LIMIT:
        message = message[: TELEGRAM_MESSAGE_LIMIT - 20] + "\n\n...[truncated]"
    payload = {"chat_id": chat_id, "text": message}
    if parse_mode:
        payload["parse_mode"] = parse_mode
    telegram_request("sendMessage", payload, timeout=30)


def answer_pre_checkout_query(query_id: str, ok: bool, error_message: str = "") -> None:
    payload: dict = {"pre_checkout_query_id": query_id, "ok": ok}
    if not ok and error_message:
        payload["error_message"] = error_message
    telegram_request("answerPreCheckoutQuery", payload)


# ---------------------------------------------------------------------------
# Credit helpers
# ---------------------------------------------------------------------------

def get_credits(redis: Redis, chat_id: str) -> int:
    raw = redis.get(f"{REDIS_CREDITS_PREFIX}{chat_id}")
    return int(decode(raw)) if raw else 0


def add_credits(redis: Redis, chat_id: str, amount: int) -> int:
    new_balance = redis.incrby(f"{REDIS_CREDITS_PREFIX}{chat_id}", amount)
    return int(new_balance)


def deduct_credits(redis: Redis, chat_id: str, amount: int) -> tuple[bool, int]:
    """Returns (success, new_balance). Atomic check-and-deduct."""
    key = f"{REDIS_CREDITS_PREFIX}{chat_id}"
    with redis.pipeline() as pipe:
        while True:
            try:
                pipe.watch(key)
                current = int(decode(pipe.get(key) or b"0"))
                if current < amount:
                    pipe.reset()
                    return False, current
                pipe.multi()
                pipe.decrby(key, amount)
                result = pipe.execute()
                return True, int(result[0])
            except Exception:
                continue


# ---------------------------------------------------------------------------
# User / referral helpers
# ---------------------------------------------------------------------------

def is_new_user(redis: Redis, chat_id: str) -> bool:
    return not redis.exists(f"{REDIS_USER_PREFIX}{chat_id}")


def register_user(redis: Redis, chat_id: str, referrer_id: Optional[str] = None) -> None:
    user_key = f"{REDIS_USER_PREFIX}{chat_id}"
    mapping: dict = {"created_at": datetime.now(timezone.utc).isoformat()}
    if referrer_id:
        mapping["referred_by"] = referrer_id
    redis.hset(user_key, mapping=mapping)
    add_credits(redis, chat_id, CREDITS_NEW_USER)


def get_referrer(redis: Redis, chat_id: str) -> Optional[str]:
    raw = redis.hget(f"{REDIS_USER_PREFIX}{chat_id}", "referred_by")
    return decode(raw) if raw else None


def has_run_before(redis: Redis, chat_id: str) -> bool:
    raw = redis.hget(f"{REDIS_USER_PREFIX}{chat_id}", "first_run_done")
    return decode(raw) == "1" if raw else False


def mark_first_run(redis: Redis, chat_id: str) -> None:
    redis.hset(f"{REDIS_USER_PREFIX}{chat_id}", "first_run_done", "1")


def get_referral_code(chat_id: str) -> str:
    return chat_id


def get_bot_username() -> str:
    return os.getenv("TELEGRAM_BOT_USERNAME", "graphref_bot")


# ---------------------------------------------------------------------------
# Domain helpers
# ---------------------------------------------------------------------------

def normalize_domain(value: str) -> str:
    candidate = value.strip()
    if not candidate:
        return ""
    if "://" not in candidate:
        candidate = f"https://{candidate}"
    parsed = urllib.parse.urlparse(candidate)
    host = parsed.netloc or parsed.path
    return host.lower().removeprefix("www.").strip("/")


def parse_run_command(text: str) -> tuple[Optional[str], Optional[str]]:
    _, _, raw_args = text.partition(" ")
    raw_args = raw_args.strip()
    if not raw_args:
        return None, None

    if "|" in raw_args:
        keyword, domain = raw_args.split("|", 1)
        return keyword.strip(), normalize_domain(domain)

    lines = [line.strip() for line in raw_args.splitlines() if line.strip()]
    if len(lines) >= 2:
        domain = normalize_domain(lines[-1])
        keyword = " ".join(lines[:-1]).strip()
        return keyword, domain

    keyword, separator, domain = raw_args.rpartition(" ")
    if separator:
        return keyword.strip(), normalize_domain(domain)
    return None, None


def command_name(text: str) -> str:
    head = text.strip().split(maxsplit=1)[0]
    return head.split("@", 1)[0].lower()


# ---------------------------------------------------------------------------
# Text helpers
# ---------------------------------------------------------------------------

def usage_text() -> str:
    return (
        "Commands\n"
        "/run <keyword> | <domain>\n"
        "/status [job_id]\n"
        "/jobs [n]\n"
        "/queue\n"
        "/cancel [job_id]\n"
        "/credits\n"
        "/buy\n"
        "/referral\n"
        "/help\n\n"
        "Example\n"
        "/run <keyword> | <domain>\n\n"
        "Notes\n"
        "- /status omits job_id to check the latest job.\n"
        "- /cancel works on queued jobs only.\n"
        "- Each /run costs 10 credits."
    )


def start_text(redis: Redis, chat_id: str) -> str:
    credits = get_credits(redis, chat_id)
    job_ids = get_recent_job_ids(redis, chat_id, limit=3)

    lines = [
        "<b>🚀 Welcome to Graphref!</b>",
        "",
        "✨ <b>How to use:</b>",
        "Simply provide a <b>keyword</b> and a <b>domain</b> to trigger organic search & clicks.",
        "",
        f"💰 <b>Your Credits:</b> {credits}",
        f"🎫 <b>Cost:</b> 10 credits per task",
        "",
        "<b>[ Run a Task ]</b>",
        "<code>/run &lt;keyword&gt; | &lt;domain&gt;</code>",
        "",
        "⚠️ <b>Important Notes:</b>",
        "• The <b>keyword</b> must be indexed in Search Console for at least 24h.",
        "• The <b>domain</b> must start with <code>https://</code> and be visible in Google search results.",
        "",
        "📖 Type /help to see all commands.",
    ]

    if job_ids:
        lines.append("")
        lines.append("Recent jobs")
        for job_id in job_ids:
            try:
                job = Job.fetch(job_id, connection=redis)
                meta = get_job_meta(redis, job_id)
                keyword = meta.get("keyword") or "unknown"
                domain = meta.get("domain") or "unknown"
                status = job.get_status(refresh=True)
                lines.append(f"- {status} | {keyword} | {domain}")
            except Exception:
                lines.append(f"- {job_id}: missing")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Job helpers
# ---------------------------------------------------------------------------

def get_recent_job_ids(redis: Redis, chat_id: str, limit: int = 5) -> list[str]:
    key = f"{REDIS_CHAT_JOBS_PREFIX}{chat_id}"
    values = redis.lrange(key, 0, max(limit - 1, 0))
    return [decode(value) for value in values]


def remember_chat_job(redis: Redis, chat_id: str, job_id: str) -> None:
    key = f"{REDIS_CHAT_JOBS_PREFIX}{chat_id}"
    redis.lpush(key, job_id)
    redis.ltrim(key, 0, RECENT_JOB_LIMIT - 1)


def get_job_meta(redis: Redis, job_id: str) -> dict[str, str]:
    raw_meta = redis.hgetall(f"{REDIS_JOB_PREFIX}{job_id}")
    return {decode(key): decode(value) for key, value in raw_meta.items()}


def format_job_message(redis: Redis, job: Job, keyword: str, domain: str) -> str:
    status = job.get_status(refresh=True)
    lines = [
        f"job_id: {job.id}",
        f"queue_status: {status}",
        f"keyword: {keyword}",
        f"domain: {domain}",
    ]

    if status == "queued":
        position = get_queue(redis).get_job_position(job.id)
        if position is not None:
            lines.append(f"queue_position: {position + 1}")

    result = job.result if isinstance(job.result, dict) else None
    if result:
        lines.append(f"result_status: {result.get('status')}")
        if result.get("code") is not None:
            lines.append(f"exit_code: {result.get('code')}")

        preview = (result.get("stderr") or result.get("stdout") or "").strip()
        if preview:
            lines.append("")
            lines.append(preview[-1200:])

    if job.exc_info:
        lines.append("")
        lines.append(job.exc_info[-1200:])

    return "\n".join(lines)


def enqueue_job(redis: Redis, queue: Queue, chat_id: str, keyword: str, domain: str) -> Job:
    payload = {"search_keyword": keyword, "target_domain": domain}
    job = queue.enqueue(run_job, payload, job_timeout=JOB_TIMEOUT)
    meta_key = f"{REDIS_JOB_PREFIX}{job.id}"
    redis.hset(
        meta_key,
        mapping={
            "chat_id": chat_id,
            "keyword": keyword,
            "domain": domain,
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    redis.sadd(REDIS_PENDING_JOBS_KEY, job.id)
    remember_chat_job(redis, chat_id, job.id)
    return job


# ---------------------------------------------------------------------------
# Command handlers
# ---------------------------------------------------------------------------

def handle_start(redis: Redis, chat_id: str, text: str) -> None:
    _, _, raw_args = text.partition(" ")
    referral_code = raw_args.strip() or None

    if is_new_user(redis, chat_id):
        referrer_id = referral_code if referral_code and referral_code != chat_id else None
        register_user(redis, chat_id, referrer_id=referrer_id)
        send_message(chat_id, start_text(redis, chat_id), parse_mode="HTML")
        return

    send_message(chat_id, start_text(redis, chat_id), parse_mode="HTML")


def handle_run(redis: Redis, queue: Queue, chat_id: str, text: str) -> None:
    keyword, domain = parse_run_command(text)
    if not keyword or not domain:
        send_message(chat_id, "Invalid format.\n\n" + usage_text())
        return

    success, balance = deduct_credits(redis, chat_id, CREDITS_PER_RUN)
    if not success:
        send_message(
            chat_id,
            f"Not enough credits. You have {balance} credits but need {CREDITS_PER_RUN}.\n\nTop up with /buy",
        )
        return

    # Referral bonus: award referrer on referree's first run
    if not has_run_before(redis, chat_id):
        mark_first_run(redis, chat_id)
        referrer_id = get_referrer(redis, chat_id)
        if referrer_id:
            new_referrer_balance = add_credits(redis, referrer_id, CREDITS_REFERRAL_BONUS)
            try:
                send_message(
                    referrer_id,
                    f"Referral bonus! Your referral just ran their first job.\n"
                    f"+{CREDITS_REFERRAL_BONUS} credits added. Balance: {new_referrer_balance}",
                )
            except Exception:
                pass

    job = enqueue_job(redis, queue, chat_id, keyword, domain)
    send_message(
        chat_id,
        (
            f"Job queued. Credits remaining: {balance}\n"
            f"job_id: {job.id}\n"
            f"keyword: {keyword}\n"
            f"domain: {domain}\n\n"
            f"Check progress: /status {job.id}"
        ),
    )


def handle_status(redis: Redis, chat_id: str, text: str) -> None:
    _, _, raw_job_id = text.partition(" ")
    job_id = raw_job_id.strip()
    if not job_id:
        recent_jobs = get_recent_job_ids(redis, chat_id, limit=1)
        if not recent_jobs:
            send_message(chat_id, "No recent jobs. Start one with /run")
            return
        job_id = recent_jobs[0]

    try:
        job = Job.fetch(job_id, connection=redis)
    except Exception:
        send_message(chat_id, f"Job not found: {job_id}")
        return

    meta = get_job_meta(redis, job_id)
    owner_chat_id = meta.get("chat_id")
    if owner_chat_id and owner_chat_id != chat_id:
        send_message(chat_id, "This job belongs to a different chat.")
        return

    keyword = meta.get("keyword") or "unknown"
    domain = meta.get("domain") or "unknown"
    send_message(chat_id, format_job_message(redis, job, keyword, domain))


def handle_jobs(redis: Redis, chat_id: str, text: str) -> None:
    _, _, raw_limit = text.partition(" ")
    raw_limit = raw_limit.strip()
    limit = 5
    if raw_limit:
        try:
            limit = max(1, min(int(raw_limit), 10))
        except ValueError:
            send_message(chat_id, "Please enter a number. Example: /jobs 5")
            return

    job_ids = get_recent_job_ids(redis, chat_id, limit=limit)
    if not job_ids:
        send_message(chat_id, "No recent jobs.")
        return

    lines = ["Recent jobs"]
    for job_id in job_ids:
        try:
            job = Job.fetch(job_id, connection=redis)
        except Exception:
            lines.append(f"- {job_id}: missing")
            continue

        meta = get_job_meta(redis, job_id)
        keyword = meta.get("keyword") or "unknown"
        domain = meta.get("domain") or "unknown"
        lines.append(f"- {job.get_status(refresh=True)} | {keyword} | {domain}")

    send_message(chat_id, "\n".join(lines))


def handle_queue(redis: Redis, chat_id: str) -> None:
    queue = get_queue(redis)
    pending_own_jobs = 0
    for job_id in get_recent_job_ids(redis, chat_id, limit=RECENT_JOB_LIMIT):
        try:
            job = Job.fetch(job_id, connection=redis)
        except Exception:
            continue
        if job.get_status(refresh=True) in {"queued", "started"}:
            pending_own_jobs += 1

    send_message(
        chat_id,
        (
            "Queue status\n"
            f"queue: {QUEUE_NAME}\n"
            f"queued_jobs: {len(queue)}\n"
            f"your_active_jobs: {pending_own_jobs}"
        ),
    )


def handle_cancel(redis: Redis, chat_id: str, text: str) -> None:
    _, _, raw_job_id = text.partition(" ")
    job_id = raw_job_id.strip()
    if not job_id:
        recent_jobs = get_recent_job_ids(redis, chat_id, limit=1)
        if not recent_jobs:
            send_message(chat_id, "No recent job to cancel.")
            return
        job_id = recent_jobs[0]

    meta = get_job_meta(redis, job_id)
    owner_chat_id = meta.get("chat_id")
    if owner_chat_id and owner_chat_id != chat_id:
        send_message(chat_id, "Cannot cancel a job from another chat.")
        return

    try:
        job = Job.fetch(job_id, connection=redis)
    except Exception:
        send_message(chat_id, f"Job not found: {job_id}")
        return

    status = job.get_status(refresh=True)
    if status == "queued":
        job.cancel()
        redis.srem(REDIS_PENDING_JOBS_KEY, job_id)
        # Refund credits
        new_balance = add_credits(redis, chat_id, CREDITS_PER_RUN)
        send_message(chat_id, f"Job cancelled: {job_id}\n{CREDITS_PER_RUN} credits refunded. Balance: {new_balance}")
        return
    if status in {"finished", "failed", "canceled", "stopped"}:
        send_message(chat_id, f"Job already finished: {job_id} ({status})")
        return

    send_message(chat_id, f"Cannot cancel a running job: {job_id} ({status})")


def handle_credits(redis: Redis, chat_id: str) -> None:
    balance = get_credits(redis, chat_id)
    runs_left = balance // CREDITS_PER_RUN
    send_message(
        chat_id,
        (
            f"Credits: {balance}\n"
            f"Runs available: {runs_left}\n\n"
            "Top up with /buy"
        ),
    )


def handle_buy(chat_id: str) -> None:
    lines = ["Choose a package and send the command:\n"]
    for label, stars, credits in STAR_PACKAGES:
        lines.append(f"/buy_{label} — {credits} credits ({stars} Stars)")
    send_message(chat_id, "\n".join(lines))


def handle_buy_package(redis: Redis, chat_id: str, package_key: str) -> None:
    package = next((p for p in STAR_PACKAGES if p[0] == package_key), None)
    if not package:
        send_message(chat_id, "Unknown package. Use /buy to see options.")
        return

    label, stars, credits = package
    payload = f"credits:{credits}"

    try:
        telegram_request(
            "sendInvoice",
            {
                "chat_id": chat_id,
                "title": f"Graphref {label.capitalize()} Pack",
                "description": f"{credits} credits ({stars} Telegram Stars)",
                "payload": payload,
                "currency": "XTR",
                "prices": [{"label": f"{credits} Credits", "amount": stars}],
            },
        )
    except Exception as exc:
        send_message(chat_id, f"Failed to create invoice: {exc}")


def handle_successful_payment(redis: Redis, chat_id: str, payment: dict) -> None:
    payload = payment.get("invoice_payload", "")
    try:
        _, credits_str = payload.split(":", 1)
        credits = int(credits_str)
    except Exception:
        send_message(chat_id, "Payment received but could not parse credits. Please contact support.")
        return

    new_balance = add_credits(redis, chat_id, credits)
    send_message(
        chat_id,
        (
            f"Payment confirmed!\n"
            f"+{credits} credits added.\n"
            f"Balance: {new_balance}"
        ),
    )


def handle_referral(chat_id: str) -> None:
    bot_username = get_bot_username()
    code = get_referral_code(chat_id)
    link = f"https://t.me/{bot_username}?start={code}"
    send_message(
        chat_id,
        (
            f"Your referral link:\n{link}\n\n"
            f"When someone joins via your link and runs their first job,\n"
            f"you earn {CREDITS_REFERRAL_BONUS} credits."
        ),
    )


# ---------------------------------------------------------------------------
# Message dispatcher
# ---------------------------------------------------------------------------

def process_message(redis: Redis, queue: Queue, message: dict) -> None:
    chat = message.get("chat") or {}
    chat_id = str(chat.get("id", ""))
    text = (message.get("text") or "").strip()
    payment = message.get("successful_payment")

    if not chat_id:
        return

    # Handle successful Star payment
    if payment:
        handle_successful_payment(redis, chat_id, payment)
        return

    if not text:
        return

    if BOT_ALLOWED_CHAT_IDS and chat_id not in BOT_ALLOWED_CHAT_IDS:
        send_message(chat_id, "This chat is not authorized.")
        return

    name = command_name(text)

    if name == "/start":
        handle_start(redis, chat_id, text)
        return
    if name == "/help":
        send_message(chat_id, usage_text())
        return
    if name == "/run":
        handle_run(redis, queue, chat_id, text)
        return
    if name == "/status":
        handle_status(redis, chat_id, text)
        return
    if name == "/jobs":
        handle_jobs(redis, chat_id, text)
        return
    if name == "/queue":
        handle_queue(redis, chat_id)
        return
    if name == "/cancel":
        handle_cancel(redis, chat_id, text)
        return
    if name == "/credits":
        handle_credits(redis, chat_id)
        return
    if name == "/buy":
        handle_buy(chat_id)
        return
    if name in {f"/buy_{p[0]}" for p in STAR_PACKAGES}:
        package_key = name.removeprefix("/buy_")
        handle_buy_package(redis, chat_id, package_key)
        return
    if name == "/referral":
        handle_referral(chat_id)
        return

    send_message(chat_id, "Unknown command.\n\n" + usage_text())


def process_pre_checkout_query(query: dict) -> None:
    answer_pre_checkout_query(query["id"], ok=True)


# ---------------------------------------------------------------------------
# Polling
# ---------------------------------------------------------------------------

def poll_updates(redis: Redis, queue: Queue) -> None:
    current_offset = redis.get(REDIS_UPDATE_OFFSET_KEY)
    payload = {
        "timeout": BOT_POLL_TIMEOUT,
        "allowed_updates": ["message", "pre_checkout_query"],
    }
    if current_offset:
        payload["offset"] = int(decode(current_offset))

    response = telegram_request("getUpdates", payload, timeout=BOT_POLL_TIMEOUT + 5)
    for update in response.get("result", []):
        update_id = int(update["update_id"])
        if "pre_checkout_query" in update:
            process_pre_checkout_query(update["pre_checkout_query"])
        else:
            process_message(redis, queue, update.get("message") or {})
        redis.set(REDIS_UPDATE_OFFSET_KEY, update_id + 1)


def notify_completed_jobs(redis: Redis) -> None:
    pending_job_ids = sorted(redis.smembers(REDIS_PENDING_JOBS_KEY))
    for raw_job_id in pending_job_ids:
        job_id = decode(raw_job_id)
        meta_key = f"{REDIS_JOB_PREFIX}{job_id}"
        meta = redis.hgetall(meta_key)
        chat_id = decode(meta.get(b"chat_id"))
        if not chat_id:
            redis.srem(REDIS_PENDING_JOBS_KEY, job_id)
            redis.delete(meta_key)
            continue

        try:
            job = Job.fetch(job_id, connection=redis)
        except Exception:
            send_message(chat_id, f"Lost track of job: {job_id}")
            redis.srem(REDIS_PENDING_JOBS_KEY, job_id)
            redis.delete(meta_key)
            continue

        status = job.get_status(refresh=True)
        if status not in {"finished", "failed", "stopped", "canceled"}:
            continue

        keyword = decode(meta.get(b"keyword")) or "unknown"
        domain = decode(meta.get(b"domain")) or "unknown"
        result = job.result if isinstance(job.result, dict) else {}
        done_label = "Job done" if result.get("status") == "ok" and result.get("code") == 0 else "Job failed"
        body = format_job_message(redis, job, keyword, domain)
        send_message(chat_id, f"{done_label}\n\n{body}")
        redis.srem(REDIS_PENDING_JOBS_KEY, job_id)
        redis.delete(meta_key)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    if not TELEGRAM_BOT_TOKEN:
        raise SystemExit("Missing TELEGRAM_BOT_TOKEN")

    redis = get_redis()
    queue = get_queue(redis)
    print("telegram bot started")

    while True:
        try:
            notify_completed_jobs(redis)
            poll_updates(redis, queue)
        except KeyboardInterrupt:
            raise
        except Exception as exc:
            print(f"telegram bot loop error: {exc}")
            traceback.print_exc()
            time.sleep(3)


if __name__ == "__main__":
    main()
