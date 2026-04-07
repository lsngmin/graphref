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
TELEGRAM_MESSAGE_LIMIT = 3900
RECENT_JOB_LIMIT = 20


def get_redis() -> Redis:
    return Redis.from_url(REDIS_URL)


def get_queue(redis: Redis) -> Queue:
    return Queue(QUEUE_NAME, connection=redis)


def decode(value):
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    return value


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


def send_message(chat_id: str, text: str) -> None:
    message = text.strip()
    if len(message) > TELEGRAM_MESSAGE_LIMIT:
        message = message[: TELEGRAM_MESSAGE_LIMIT - 20] + "\n\n...[truncated]"
    telegram_request("sendMessage", {"chat_id": chat_id, "text": message}, timeout=30)


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


def usage_text() -> str:
    return (
        "명령어 목록\n"
        "/run <검색어> | <도메인>\n"
        "/status [job_id]\n"
        "/jobs [개수]\n"
        "/queue\n"
        "/cancel [job_id]\n"
        "/help\n\n"
        "예시\n"
        "/run tiktok save.com | tiktok-save.com\n\n"
        "설명\n"
        "- /status 는 job_id 생략 시 마지막 작업을 조회합니다.\n"
        "- /cancel 은 대기중(queued) 작업만 취소합니다."
    )


def start_text() -> str:
    return (
        "Graphref Bot\n\n"
        "Searches your keyword and clicks your site.\n\n"
        "Run a task\n"
        "/run <keyword> | <domain>\n\n"
        "All commands: /help"
    )


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


def handle_run(redis: Redis, queue: Queue, chat_id: str, text: str) -> None:
    keyword, domain = parse_run_command(text)
    if not keyword or not domain:
        send_message(chat_id, "입력 형식이 잘못되었습니다.\n\n" + usage_text())
        return

    job = enqueue_job(redis, queue, chat_id, keyword, domain)
    send_message(
        chat_id,
        (
            "작업을 등록했습니다.\n"
            f"job_id: {job.id}\n"
            f"keyword: {keyword}\n"
            f"domain: {domain}\n\n"
            "최근 작업: /jobs\n"
            f"진행 확인: /status {job.id}"
        ),
    )


def handle_status(redis: Redis, chat_id: str, text: str) -> None:
    _, _, raw_job_id = text.partition(" ")
    job_id = raw_job_id.strip()
    if not job_id:
        recent_jobs = get_recent_job_ids(redis, chat_id, limit=1)
        if not recent_jobs:
            send_message(chat_id, "최근 작업이 없습니다. 먼저 /run 으로 작업을 등록하세요.")
            return
        job_id = recent_jobs[0]

    try:
        job = Job.fetch(job_id, connection=redis)
    except Exception:
        send_message(chat_id, f"job을 찾지 못했습니다: {job_id}")
        return

    meta = get_job_meta(redis, job_id)
    owner_chat_id = meta.get("chat_id")
    if owner_chat_id and owner_chat_id != chat_id:
        send_message(chat_id, "다른 채팅에서 생성한 job 입니다.")
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
            send_message(chat_id, "숫자로 개수를 넣어주세요. 예시: /jobs 5")
            return

    job_ids = get_recent_job_ids(redis, chat_id, limit=limit)
    if not job_ids:
        send_message(chat_id, "최근 작업이 없습니다.")
        return

    lines = ["최근 작업"]
    for job_id in job_ids:
        try:
            job = Job.fetch(job_id, connection=redis)
        except Exception:
            lines.append(f"- {job_id}: missing")
            continue

        meta = get_job_meta(redis, job_id)
        keyword = meta.get("keyword") or "unknown"
        domain = meta.get("domain") or "unknown"
        lines.append(f"- {job.id}: {job.get_status(refresh=True)} | {keyword} | {domain}")

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
            "큐 상태\n"
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
            send_message(chat_id, "취소할 최근 작업이 없습니다.")
            return
        job_id = recent_jobs[0]

    meta = get_job_meta(redis, job_id)
    owner_chat_id = meta.get("chat_id")
    if owner_chat_id and owner_chat_id != chat_id:
        send_message(chat_id, "다른 채팅에서 생성한 job 은 취소할 수 없습니다.")
        return

    try:
        job = Job.fetch(job_id, connection=redis)
    except Exception:
        send_message(chat_id, f"job을 찾지 못했습니다: {job_id}")
        return

    status = job.get_status(refresh=True)
    if status == "queued":
        job.cancel()
        redis.srem(REDIS_PENDING_JOBS_KEY, job_id)
        send_message(chat_id, f"job을 취소했습니다: {job_id}")
        return
    if status in {"finished", "failed", "canceled", "stopped"}:
        send_message(chat_id, f"이미 종료된 job 입니다: {job_id} ({status})")
        return

    send_message(chat_id, f"실행 중인 job 은 취소하지 않습니다: {job_id} ({status})")


def process_message(redis: Redis, queue: Queue, message: dict) -> None:
    chat = message.get("chat") or {}
    chat_id = str(chat.get("id", ""))
    text = (message.get("text") or "").strip()
    if not chat_id or not text:
        return

    if BOT_ALLOWED_CHAT_IDS and chat_id not in BOT_ALLOWED_CHAT_IDS:
        send_message(chat_id, "허용되지 않은 chat_id 입니다.")
        return

    name = command_name(text)
    if name == "/start":
        send_message(chat_id, start_text())
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

    send_message(chat_id, "지원하지 않는 명령입니다.\n\n" + usage_text())


def poll_updates(redis: Redis, queue: Queue) -> None:
    current_offset = redis.get(REDIS_UPDATE_OFFSET_KEY)
    payload = {
        "timeout": BOT_POLL_TIMEOUT,
        "allowed_updates": ["message"],
    }
    if current_offset:
        payload["offset"] = int(decode(current_offset))

    response = telegram_request("getUpdates", payload, timeout=BOT_POLL_TIMEOUT + 5)
    for update in response.get("result", []):
        update_id = int(update["update_id"])
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
            send_message(chat_id, f"job 상태를 찾지 못해 추적을 종료합니다: {job_id}")
            redis.srem(REDIS_PENDING_JOBS_KEY, job_id)
            redis.delete(meta_key)
            continue

        status = job.get_status(refresh=True)
        if status not in {"finished", "failed", "stopped", "canceled"}:
            continue

        keyword = decode(meta.get(b"keyword")) or "unknown"
        domain = decode(meta.get(b"domain")) or "unknown"
        result = job.result if isinstance(job.result, dict) else {}
        done_label = "작업 완료" if result.get("status") == "ok" and result.get("code") == 0 else "작업 실패"
        body = format_job_message(redis, job, keyword, domain)
        send_message(chat_id, f"{done_label}\n\n{body}")
        redis.srem(REDIS_PENDING_JOBS_KEY, job_id)
        redis.delete(meta_key)


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
