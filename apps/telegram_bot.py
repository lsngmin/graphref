import asyncio
import html
import json
import logging
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Optional

import aiohttp
from redis import Redis, ConnectionPool
from rq import Queue
from rq.job import Job

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger(__name__)

try:
    from paypal import PayPalError, create_checkout_url, get_packages
except ModuleNotFoundError:
    from apps.paypal import PayPalError, create_checkout_url, get_packages

try:
    from supabase_store import SupabaseStore, SupabaseStoreError
except ModuleNotFoundError:
    from apps.supabase_store import SupabaseStore, SupabaseStoreError

try:
    from tasks import run_job
except ModuleNotFoundError:
    from apps.tasks import run_job

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
TELEGRAM_MESSAGE_LIMIT = 3900
RECENT_JOB_LIMIT = 20

# Credit policy
CREDITS_PER_RUN = 10
CREDITS_NEW_USER = 50
CREDITS_REFERRAL_BONUS = 30  # awarded to referrer on referree's first run
USER_STORE: Optional[SupabaseStore] = None


# ---------------------------------------------------------------------------
# Redis helpers
# ---------------------------------------------------------------------------

_redis_pool: Optional[ConnectionPool] = None


def get_redis_pool() -> ConnectionPool:
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = ConnectionPool.from_url(REDIS_URL)
    return _redis_pool


def get_redis() -> Redis:
    return Redis(connection_pool=get_redis_pool())


def get_queue(redis: Redis) -> Queue:
    return Queue(QUEUE_NAME, connection=redis)


def decode(value):
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    return value


def get_user_store() -> SupabaseStore:
    global USER_STORE
    if USER_STORE is None:
        USER_STORE = SupabaseStore.from_env()
    return USER_STORE


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


def send_message(
    chat_id: str,
    text: str,
    parse_mode: Optional[str] = None,
    reply_markup: Optional[dict] = None,
) -> None:
    message = text.strip()
    if len(message) > TELEGRAM_MESSAGE_LIMIT:
        message = message[: TELEGRAM_MESSAGE_LIMIT - 20] + "\n\n...[truncated]"
    payload = {"chat_id": chat_id, "text": message}
    if parse_mode:
        payload["parse_mode"] = parse_mode
    if reply_markup:
        payload["reply_markup"] = reply_markup
    telegram_request("sendMessage", payload, timeout=30)


async def async_send_message(
    chat_id: str,
    text: str,
    parse_mode: Optional[str] = None,
    reply_markup: Optional[dict] = None,
) -> None:
    message = text.strip()
    if len(message) > TELEGRAM_MESSAGE_LIMIT:
        message = message[: TELEGRAM_MESSAGE_LIMIT - 20] + "\n\n...[truncated]"
    payload: dict = {"chat_id": chat_id, "text": message}
    if parse_mode:
        payload["parse_mode"] = parse_mode
    if reply_markup:
        payload["reply_markup"] = reply_markup
    timeout = aiohttp.ClientTimeout(total=30)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.post(f"{TELEGRAM_API_BASE}/sendMessage", json=payload) as resp:
            result = await resp.json()
            if not result.get("ok"):
                raise RuntimeError(f"Telegram API error sendMessage: {result}")


def answer_callback_query(callback_query_id: str, text: Optional[str] = None) -> None:
    payload = {"callback_query_id": callback_query_id}
    if text:
        payload["text"] = text
    telegram_request("answerCallbackQuery", payload, timeout=30)


# ---------------------------------------------------------------------------
# Credit helpers
# ---------------------------------------------------------------------------

def get_credits(redis: Redis, chat_id: str) -> int:
    user = get_user_store().get_user(chat_id)
    return int(user["credits"]) if user else 0


def add_credits(
    redis: Redis,
    chat_id: str,
    amount: int,
    reason: str = "credit_add",
    metadata: Optional[dict] = None,
) -> int:
    return get_user_store().add_credits(chat_id, amount, reason=reason, metadata=metadata)


def deduct_credits(
    redis: Redis,
    chat_id: str,
    amount: int,
    reason: str = "credit_deduct",
    metadata: Optional[dict] = None,
) -> tuple[bool, int]:
    return get_user_store().deduct_credits(chat_id, amount, reason=reason, metadata=metadata)


# ---------------------------------------------------------------------------
# User / referral helpers
# ---------------------------------------------------------------------------

def is_new_user(redis: Redis, chat_id: str) -> bool:
    return get_user_store().get_user(chat_id) is None


def register_user(redis: Redis, chat_id: str, referrer_id: Optional[str] = None) -> None:
    get_user_store().register_user(
        chat_id,
        initial_credits=CREDITS_NEW_USER,
        referred_by=referrer_id,
        reason="signup_bonus",
        metadata={"referred_by": referrer_id} if referrer_id else {},
    )


def ensure_user(redis: Redis, chat_id: str, referrer_id: Optional[str] = None) -> bool:
    if is_new_user(redis, chat_id):
        register_user(redis, chat_id, referrer_id=referrer_id)
        return True
    return False


def get_referrer(redis: Redis, chat_id: str) -> Optional[str]:
    user = get_user_store().get_user(chat_id)
    return user.get("referred_by") if user else None


def has_run_before(redis: Redis, chat_id: str) -> bool:
    user = get_user_store().get_user(chat_id)
    return bool(user.get("first_run_done")) if user else False


def mark_first_run(redis: Redis, chat_id: str) -> None:
    get_user_store().begin_first_run(chat_id)


def begin_first_run(redis: Redis, chat_id: str) -> tuple[bool, Optional[str]]:
    return get_user_store().begin_first_run(chat_id)


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

    parts = [part for part in raw_args.split() if part]
    if len(parts) < 2:
        return None, None

    domain = normalize_domain(parts[-1].lstrip("|"))
    keyword_parts = parts[:-1]
    if keyword_parts and keyword_parts[-1] == "|":
        keyword_parts = keyword_parts[:-1]

    keyword = " ".join(keyword_parts).strip()
    if not keyword or not domain:
        return None, None
    return keyword, domain


def command_name(text: str) -> str:
    head = text.strip().split(maxsplit=1)[0]
    return head.split("@", 1)[0].lower()


# ---------------------------------------------------------------------------
# Text helpers
# ---------------------------------------------------------------------------

def escape_html(value: object) -> str:
    return html.escape(str(value))


def get_job_status_display(status: str, result: Optional[dict] = None) -> tuple[str, str, str]:
    if status == "queued":
        return ("⏳ Job Status", "Queued", "Your job is waiting in the queue.")
    if status == "started":
        return ("🚀 Job Status", "Running", "Your job is currently being processed.")
    if status == "finished":
        if result and result.get("status") == "ok" and result.get("code") == 0:
            return ("✅ Job Complete", "Completed", "The run finished successfully.")
        return ("⚠️ Job Complete", "Finished with issues", "The run finished, but it reported an issue.")
    if status == "failed":
        return ("❌ Job Failed", "Failed", "The run stopped because of an error.")
    if status == "canceled":
        return ("🛑 Job Cancelled", "Cancelled", "This job was cancelled before completion.")
    if status == "stopped":
        return ("🛑 Job Stopped", "Stopped", "This job was stopped before completion.")
    return ("ℹ️ Job Status", status.title(), "Job status updated.")


def get_job_detail_preview(job: Job) -> Optional[str]:
    result = job.result if isinstance(job.result, dict) else None
    preview = ""

    if result:
        preview = str(result.get("stderr") or result.get("stdout") or "").strip()

    if not preview and job.exc_info:
        preview = str(job.exc_info).strip()

    if not preview:
        return None

    compact = "\n".join(line.rstrip() for line in preview.splitlines() if line.strip()).strip()
    if not compact:
        return None

    return compact[-500:]


def usage_text() -> str:
    lines = [
        "<b>📖 Graphref Bot Commands</b>",
        "",
        "<code>/run &lt;keyword&gt; &lt;domain&gt;</code>",
        " → Start a new task. (Costs <b>10 credits</b>)",
        "",
        "<code>/status</code>",
        " → Check your most recent job.",
        "",
        "<code>/jobs &lt;n&gt;</code>",
        " → Show recent jobs.",
        "",
        "<code>/queue</code>",
        " → Show server load & queue.",
        "",
        "<code>/cancel [job_id]</code>",
        " → Cancel a <b>queued</b> job. Refunds 10 credits.",
        "",
        "<code>/credits</code> → Check your balance.",
        "<code>/buy</code> → Top up credits.",
        "<code>/referral</code> → Get your invite link. (+30 credits when referral runs first job)",
        "<code>/help</code> → Show this guide.",
        "",
        "<b>🎁 Bonuses</b>",
        "• New users start with <b>50 free credits</b>.",
        "• Each task costs <b>10 credits</b>.",
    ]
    return "\n".join(lines)


def start_text(redis: Redis, chat_id: str) -> str:
    credits = get_credits(redis, chat_id)
    job_ids = get_recent_job_ids(redis, chat_id, limit=3)
    is_new = not job_ids and credits == CREDITS_NEW_USER

    lines = [
        "<b>🚀 Welcome to Graphref!</b>",
        "",
    ]

    if is_new:
        lines += [
            "🎁 <b>You've received 50 free credits to get started!</b>",
            "",
        ]

    lines += [
        "Send a keyword and domain — Graphref will perform a real Google search and click your result.",
        "",
        "<b>▶ Run a job</b>",
        "<code>/run &lt;keyword&gt; &lt;domain&gt;</code>",
        "<i>Example: /run best coffee grinder mycoffeeshop.com</i>",
        "",
        "⚠️ <b>Requirements:</b>",
        "• Keyword must appear in Google search results for your domain.",
        "• Domain must include <code>https://</code>.",
        "",
        f"💰 <b>Balance:</b> {credits} credits  ({credits // CREDITS_PER_RUN} runs left)",
        f"💳 <b>Cost:</b> {CREDITS_PER_RUN} credits per run  •  /buy to top up",
        "",
        "📖 /help — all commands",
    ]

    if job_ids:
        STATUS_EMOJI = {
            "queued": "⏳", "started": "🚀", "finished": "✅",
            "failed": "❌", "stopped": "⚠️", "canceled": "🛑",
        }
        lines.append("")
        lines.append("<b>Recent jobs:</b>")
        for job_id in job_ids:
            try:
                job = Job.fetch(job_id, connection=redis)
                meta = get_job_meta(redis, job_id)
                keyword = meta.get("keyword") or "unknown"
                status = job.get_status(refresh=True)
                emoji = STATUS_EMOJI.get(status, "•")
                lines.append(f"{emoji} <code>{status}</code> — {escape_html(keyword)}")
            except Exception:
                logger.debug("job %s missing in start_text", job_id, exc_info=True)

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
    result = job.result if isinstance(job.result, dict) else None
    title, status_label, summary = get_job_status_display(status, result=result)
    lines = [
        f"<b>{title}</b>",
        "",
        f"<b>Status:</b> {escape_html(status_label)}",
        f"<b>Keyword:</b> <code>{escape_html(keyword)}</code>",
        f"<b>Domain:</b> <code>{escape_html(domain)}</code>",
    ]

    if status == "queued":
        position = get_queue(redis).get_job_position(job.id)
        if position is not None:
            lines.append(f"<b>Queue position:</b> {position + 1}")

    if result and result.get("status"):
        lines.append(f"<b>Result:</b> <code>{escape_html(result.get('status'))}</code>")
    if result and result.get("code") is not None:
        lines.append(f"<b>Exit code:</b> <code>{escape_html(result.get('code'))}</code>")

    lines.extend(["", f"<i>{escape_html(summary)}</i>"])

    preview = get_job_detail_preview(job)
    if preview:
        lines.extend([
            "",
            "<b>Details:</b>",
            f"<pre>{escape_html(preview)}</pre>",
        ])

    lines.extend([
        "",
        "<b>Job ID:</b>",
        f"<code>{escape_html(job.id)}</code>",
    ])

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

    referrer_id = referral_code if referral_code and referral_code != chat_id else None
    ensure_user(redis, chat_id, referrer_id=referrer_id)
    send_message(chat_id, start_text(redis, chat_id), parse_mode="HTML")


async def handle_start_async(redis: Redis, chat_id: str, text: str) -> None:
    _, _, raw_args = text.partition(" ")
    referral_code = raw_args.strip() or None
    referrer_id = referral_code if referral_code and referral_code != chat_id else None

    await asyncio.to_thread(ensure_user, redis, chat_id, referrer_id=referrer_id)
    body = await asyncio.to_thread(start_text, redis, chat_id)
    await async_send_message(chat_id, body, parse_mode="HTML")


def handle_run(redis: Redis, queue: Queue, chat_id: str, text: str) -> None:
    keyword, domain = parse_run_command(text)
    if not keyword or not domain:
        send_message(chat_id, "Invalid format.\n\n" + usage_text(), parse_mode="HTML")
        return

    success, balance = deduct_credits(
        redis,
        chat_id,
        CREDITS_PER_RUN,
        reason="run_charge",
        metadata={"keyword": keyword, "domain": domain},
    )
    if not success:
        send_message(
            chat_id,
            f"💳 <b>Not Enough Credits</b>\n\n"
            f"You have <b>{balance}</b> credits but need <b>{CREDITS_PER_RUN}</b> to run a job.\n\n"
            "Top up with /buy",
            parse_mode="HTML",
        )
        return

    try:
        job = enqueue_job(redis, queue, chat_id, keyword, domain)
    except Exception as exc:
        refunded_balance = add_credits(
            redis,
            chat_id,
            CREDITS_PER_RUN,
            reason="enqueue_refund",
            metadata={"keyword": keyword, "domain": domain, "error": str(exc)},
        )
        send_message(
            chat_id,
            f"⚠️ <b>Failed to Queue</b>\n\n"
            f"Could not add the job to the queue. Your <b>{CREDITS_PER_RUN} credits</b> have been refunded.\n"
            f"💰 Balance: {refunded_balance}",
            parse_mode="HTML",
        )
        return

    # Referral bonus: award referrer on referree's first successfully queued job
    is_first_run, referrer_id = begin_first_run(redis, chat_id)
    if is_first_run and referrer_id:
        new_referrer_balance = add_credits(
            redis,
            referrer_id,
            CREDITS_REFERRAL_BONUS,
            reason="referral_bonus",
            metadata={"referred_chat_id": chat_id},
        )
        try:
            send_message(
                referrer_id,
                f"Referral bonus! Your referral just ran their first job.\n"
                f"+{CREDITS_REFERRAL_BONUS} credits added. Balance: {new_referrer_balance}",
                parse_mode="HTML",
            )
        except Exception:
            logger.warning("failed to notify referrer %s", referrer_id, exc_info=True)

    send_message(
        chat_id,
        (
            f"✅ <b>Job Queued!</b>\n\n"
            f"<b>Keyword:</b> <code>{escape_html(keyword)}</code>\n"
            f"<b>Domain:</b> <code>{escape_html(domain)}</code>\n"
            f"<b>Credits remaining:</b> {balance}\n\n"
            f"<b>Job ID:</b>\n<code>{escape_html(job.id)}</code>\n\n"
            "Track progress: /status"
        ),
        parse_mode="HTML",
    )


def handle_status(redis: Redis, chat_id: str) -> None:
    recent = get_recent_job_ids(redis, chat_id, limit=1)
    if not recent:
        send_message(
            chat_id,
            "💤 <b>No Jobs Yet</b>\n\nYou haven't run any jobs yet.\n\n"
            "Start one with <code>/run &lt;keyword&gt; &lt;domain&gt;</code>",
            parse_mode="HTML",
        )
        return

    job_id = recent[0]
    try:
        job = Job.fetch(job_id, connection=redis)
    except Exception:
        logger.warning("job %s not found in Redis", job_id, exc_info=True)
        send_message(
            chat_id,
            "❌ <b>Job Not Found</b>\n\nCould not retrieve your last job.\n\n"
            "Use <code>/jobs 5</code> to list recent jobs.",
            parse_mode="HTML",
        )
        return

    meta = get_job_meta(redis, job_id)
    keyword = meta.get("keyword") or "unknown"
    domain = meta.get("domain") or "unknown"
    send_message(chat_id, format_job_message(redis, job, keyword, domain), parse_mode="HTML")


def handle_jobs(redis: Redis, chat_id: str, text: str) -> None:
    _, _, raw_limit = text.partition(" ")
    raw_limit = raw_limit.strip()
    if not raw_limit:
        send_message(
            chat_id,
            "📋 <b>How many jobs?</b>\n\nPlease enter a number, e.g. <code>/jobs 5</code>",
            parse_mode="HTML",
        )
        return

    try:
        limit = max(1, min(int(raw_limit), 10))
    except ValueError:
        send_message(
            chat_id,
            "📋 <b>Invalid number.</b>\n\nPlease enter a number, e.g. <code>/jobs 5</code>",
            parse_mode="HTML",
        )
        return

    job_ids = get_recent_job_ids(redis, chat_id, limit=limit)
    if not job_ids:
        send_message(
            chat_id,
            "📭 <b>No recent jobs.</b>\n\nStart one with <code>/run &lt;keyword&gt; &lt;domain&gt;</code>",
            parse_mode="HTML",
        )
        return

    STATUS_EMOJI = {
        "queued": "⏳", "started": "🚀", "finished": "✅",
        "failed": "❌", "stopped": "⚠️", "canceled": "🚫",
    }

    lines = [f"<b>📋 Last {len(job_ids)} job(s):</b>", ""]
    for job_id in job_ids:
        try:
            job = Job.fetch(job_id, connection=redis)
        except Exception:
            logger.debug("job %s missing from Redis in /jobs listing", job_id, exc_info=True)
            continue

        meta = get_job_meta(redis, job_id)
        keyword = meta.get("keyword") or "unknown"
        status = job.get_status(refresh=True)
        emoji = STATUS_EMOJI.get(status, "•")
        ts = ""
        if job.ended_at:
            ts = f"  <i>{job.ended_at.strftime('%m/%d %H:%M')}</i>"
        elif job.started_at:
            ts = f"  <i>{job.started_at.strftime('%m/%d %H:%M')}</i>"
        lines.append(f"{emoji} <code>{status}</code> — {escape_html(keyword)}{ts}")

    send_message(chat_id, "\n".join(lines), parse_mode="HTML")


def handle_queue(redis: Redis, chat_id: str) -> None:
    queue = get_queue(redis)
    pending_own_jobs = 0
    for job_id in get_recent_job_ids(redis, chat_id, limit=RECENT_JOB_LIMIT):
        try:
            job = Job.fetch(job_id, connection=redis)
        except Exception:
            logger.debug("job %s missing from Redis in /queue scan", job_id, exc_info=True)
            continue
        if job.get_status(refresh=True) in {"queued", "started"}:
            pending_own_jobs += 1

    total = len(queue)
    send_message(
        chat_id,
        (
            "<b>📊 Queue Status</b>\n\n"
            f"🌐 <b>Jobs in queue:</b> {total}\n"
            f"👤 <b>Your active jobs:</b> {pending_own_jobs}\n\n"
            + ("<i>Your job will start soon.</i>" if pending_own_jobs else "<i>No active jobs. Start one with /run</i>")
        ),
        parse_mode="HTML",
    )


def handle_cancel(redis: Redis, chat_id: str, text: str) -> None:
    _, _, raw_job_id = text.partition(" ")
    job_id = raw_job_id.strip()
    if not job_id:
        recent_jobs = get_recent_job_ids(redis, chat_id, limit=1)
        if not recent_jobs:
            send_message(
                chat_id,
                "💤 <b>No Recent Job</b>\n\nYou have no recent jobs to cancel.\n\n"
                "Start one with <code>/run &lt;keyword&gt; &lt;domain&gt;</code>",
                parse_mode="HTML",
            )
            return
        job_id = recent_jobs[0]

    meta = get_job_meta(redis, job_id)
    owner_chat_id = meta.get("chat_id")
    if owner_chat_id and owner_chat_id != chat_id:
        send_message(chat_id, "🚫 <b>Access Denied</b>\n\nThis job belongs to a different chat.", parse_mode="HTML")
        return

    try:
        job = Job.fetch(job_id, connection=redis)
    except Exception:
        logger.warning("job %s not found during /cancel", job_id, exc_info=True)
        send_message(chat_id, f"❌ <b>Job not found:</b> <code>{escape_html(job_id)}</code>\n\nUse /jobs to see your recent jobs.", parse_mode="HTML")
        return

    status = job.get_status(refresh=True)
    if status == "queued":
        job.cancel()
        redis.srem(REDIS_PENDING_JOBS_KEY, job_id)
        new_balance = add_credits(
            redis,
            chat_id,
            CREDITS_PER_RUN,
            reason="cancel_refund",
            metadata={"job_id": job_id},
        )
        send_message(
            chat_id,
            f"✅ <b>Job Cancelled</b>\n\n<code>{escape_html(job_id)}</code>\n\n"
            f"💰 <b>{CREDITS_PER_RUN} credits refunded.</b> Balance: {new_balance}",
            parse_mode="HTML",
        )
        return
    if status in {"finished", "failed", "canceled", "stopped"}:
        send_message(
            chat_id,
            f"ℹ️ <b>Already Finished</b>\n\nJob <code>{escape_html(job_id)}</code> is <code>{status}</code> — nothing to cancel.",
            parse_mode="HTML",
        )
        return

    send_message(
        chat_id,
        f"⚠️ <b>Cannot cancel</b>\n\nJob <code>{escape_html(job_id)}</code> is already running (<code>{status}</code>).",
        parse_mode="HTML",
    )


def handle_credits(redis: Redis, chat_id: str) -> None:
    balance = get_credits(redis, chat_id)
    runs_left = balance // CREDITS_PER_RUN
    lines = [
        "<b>💳 Your Credit Dashboard</b>",
        "",
        f"👤 <b>Account:</b> User_{chat_id}",
        "━━━━━━━━━━━━━━━━━━",
        f"💰 <b>Current Credits:</b> <code>{balance}</code>",
        f"🚀 <b>Estimated Runs:</b> <code>{runs_left}</code> times",
        "━━━━━━━━━━━━━━━━━━",
        "",
        f"💡 <i>Tip: Each run costs {CREDITS_PER_RUN} credits.</i>",
        "✨ <i>Need more power? Click the button below!</i>",
        "",
        "🛒 <b>Top up with</b> /buy",
    ]
    send_message(chat_id, "\n".join(lines), parse_mode="HTML")


def handle_buy(redis: Redis, chat_id: str) -> None:
    rows = []
    for label, credits in get_packages():
        try:
            checkout_url, _package_credits = create_checkout_url(chat_id, label)
        except PayPalError as exc:
            logger.error("PayPal checkout failed for %s package=%s: %s", chat_id, label, exc)
            send_message(chat_id, "⚠️ <b>Payment setup failed.</b>\n\nPlease try again in a moment or contact support.", parse_mode="HTML")
            return

        rows.append(
            [
                {
                    "text": f"{label.title()} • {credits} credits",
                    "url": checkout_url,
                }
            ]
        )

    send_message(
        chat_id,
        "<b>Choose a package</b>\n\nTap a button to open PayPal checkout.",
        parse_mode="HTML",
        reply_markup={"inline_keyboard": rows},
    )


def handle_buy_package(redis: Redis, chat_id: str, package_key: str) -> None:
    try:
        checkout_url, credits = create_checkout_url(chat_id, package_key)
    except PayPalError as exc:
        logger.error("PayPal checkout failed for %s package=%s: %s", chat_id, package_key, exc)
        send_message(chat_id, "⚠️ <b>Payment setup failed.</b>\n\nPlease try again in a moment or contact support.", parse_mode="HTML")
        return

    send_message(
        chat_id,
        (
            f"Checkout ready for {credits} credits.\n"
            f"{checkout_url}\n\n"
            "Credits will be added automatically after payment confirmation."
        ),
        parse_mode="HTML",
    )


def handle_referral(chat_id: str) -> None:
    bot_username = get_bot_username()
    code = get_referral_code(chat_id)
    link = f"https://t.me/{bot_username}?start={code}"
    lines = [
        "<b>🎁 Invite Friends & Earn Credits</b>",
        "",
        "Share the power of <b>Graphref</b> and get rewarded!",
        "",
        "<b>🔗 Your Unique Link:</b>",
        f"<code>{link}</code>",
        "",
        "━━━━━━━━━━━━━━━━━━",
        "<b>✨ Reward details:</b>",
        "• <b>Step 1:</b> Share your link with friends.",
        "• <b>Step 2:</b> When they run their <b>first job</b>,",
        f"• <b>Step 3:</b> You instantly earn <b>{CREDITS_REFERRAL_BONUS} credits!</b> 💰",
        "━━━━━━━━━━━━━━━━━━",
        "",
        "🚀 <i>There is no limit to how much you can earn. Start sharing now!</i>",
    ]
    send_message(chat_id, "\n".join(lines), parse_mode="HTML")


def process_callback_query(redis: Redis, callback_query: dict) -> None:
    callback_query_id = str(callback_query.get("id") or "").strip()
    message = callback_query.get("message") or {}
    chat = message.get("chat") or {}
    chat_id = str(chat.get("id") or "").strip()
    chat_type = str(chat.get("type") or "").strip()
    data = str(callback_query.get("data") or "").strip()

    if not callback_query_id:
        return

    if not chat_id or chat_type != "private":
        answer_callback_query(callback_query_id)
        return

    if BOT_ALLOWED_CHAT_IDS and chat_id not in BOT_ALLOWED_CHAT_IDS:
        answer_callback_query(callback_query_id, "This chat is not authorized.")
        return

    ensure_user(redis, chat_id)

    if data.startswith("buy:"):
        package_key = data.partition(":")[2].strip().lower()
        valid_packages = {label for label, _credits in get_packages()}
        if package_key in valid_packages:
            answer_callback_query(callback_query_id, "Generating checkout link...")
            handle_buy_package(redis, chat_id, package_key)
            return

    answer_callback_query(callback_query_id)


# ---------------------------------------------------------------------------
# Message dispatcher
# ---------------------------------------------------------------------------

def process_message(redis: Redis, queue: Queue, message: dict) -> None:
    chat = message.get("chat") or {}
    chat_id = str(chat.get("id", ""))
    chat_type = str(chat.get("type", ""))
    text = (message.get("text") or "").strip()

    if not chat_id:
        return

    if chat_type != "private":
        if text:
            send_message(chat_id, "🔒 <b>Private chat only.</b>\n\nOpen a DM with the bot and try again.", parse_mode="HTML")
        return

    if not text:
        return

    if BOT_ALLOWED_CHAT_IDS and chat_id not in BOT_ALLOWED_CHAT_IDS:
        send_message(chat_id, "🚫 <b>Access Denied.</b>\n\nThis account is not authorized to use this bot.", parse_mode="HTML")
        return

    name = command_name(text)

    if name == "/start":
        handle_start(redis, chat_id, text)
        return

    ensure_user(redis, chat_id)

    if name == "/help":
        send_message(chat_id, usage_text(), parse_mode="HTML")
        return
    if name == "/run":
        handle_run(redis, queue, chat_id, text)
        return
    if name == "/status":
        handle_status(redis, chat_id)
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
        handle_buy(redis, chat_id)
        return
    if name in {f"/buy_{label}" for label, _credits in get_packages()}:
        package_key = name.removeprefix("/buy_")
        handle_buy_package(redis, chat_id, package_key)
        return
    if name == "/referral":
        handle_referral(chat_id)
        return

    send_message(chat_id, "Unknown command.\n\n" + usage_text(), parse_mode="HTML")


# ---------------------------------------------------------------------------
# Polling
# ---------------------------------------------------------------------------

def poll_updates(redis: Redis, queue: Queue) -> None:
    current_offset = redis.get(REDIS_UPDATE_OFFSET_KEY)
    payload = {
        "timeout": BOT_POLL_TIMEOUT,
        "allowed_updates": ["message", "callback_query"],
    }
    if current_offset:
        payload["offset"] = int(decode(current_offset))

    response = telegram_request("getUpdates", payload, timeout=BOT_POLL_TIMEOUT + 5)
    for update in response.get("result", []):
        update_id = int(update["update_id"])
        if update.get("callback_query"):
            process_callback_query(redis, update["callback_query"])
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
            logger.error("lost track of job %s for chat %s", job_id, chat_id, exc_info=True)
            refunded_balance = add_credits(
                redis,
                chat_id,
                CREDITS_PER_RUN,
                reason="lost_job_refund",
                metadata={"job_id": job_id},
            )
            send_message(
                chat_id,
                f"⚠️ <b>Job tracking error</b>\n\n<code>{escape_html(job_id)}</code>\n\n"
                f"We lost track of this job and have refunded <b>{CREDITS_PER_RUN} credits</b>.\n"
                f"💰 Balance: {refunded_balance}",
                parse_mode="HTML",
            )
            redis.srem(REDIS_PENDING_JOBS_KEY, job_id)
            redis.delete(meta_key)
            continue

        status = job.get_status(refresh=True)
        if status not in {"finished", "failed", "stopped", "canceled"}:
            continue

        keyword = decode(meta.get(b"keyword")) or "unknown"
        domain = decode(meta.get(b"domain")) or "unknown"
        body = format_job_message(redis, job, keyword, domain)
        send_message(chat_id, body, parse_mode="HTML")
        redis.srem(REDIS_PENDING_JOBS_KEY, job_id)
        redis.delete(meta_key)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    """Long-polling entry point. Use only for local dev without a public URL."""
    if not TELEGRAM_BOT_TOKEN:
        raise SystemExit("Missing TELEGRAM_BOT_TOKEN")

    try:
        get_user_store()
    except SupabaseStoreError as exc:
        raise SystemExit(str(exc)) from exc

    redis = get_redis()
    queue = get_queue(redis)
    logger.info("telegram bot started (long-polling)")

    while True:
        try:
            notify_completed_jobs(redis)
            poll_updates(redis, queue)
        except KeyboardInterrupt:
            raise
        except Exception:
            logger.error("telegram bot loop error", exc_info=True)
            time.sleep(3)


if __name__ == "__main__":
    main()
