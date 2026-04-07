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
TELEGRAM_MESSAGE_LIMIT = 3900


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
        "사용법:\n"
        "/run <검색어> | <도메인>\n"
        "예시:\n"
        "/run tiktok save.com | tiktok-save.com\n\n"
        "추가 명령:\n"
        "/status <job_id>\n"
        "/help"
    )


def format_job_message(job: Job, keyword: str, domain: str) -> str:
    status = job.get_status(refresh=True)
    lines = [
        f"job_id: {job.id}",
        f"queue_status: {status}",
        f"keyword: {keyword}",
        f"domain: {domain}",
    ]

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
            f"진행 확인: /status {job.id}"
        ),
    )


def handle_status(redis: Redis, chat_id: str, text: str) -> None:
    _, _, raw_job_id = text.partition(" ")
    job_id = raw_job_id.strip()
    if not job_id:
        send_message(chat_id, "조회할 job_id를 넣어주세요.\n예시: /status 1234-uuid")
        return

    try:
        job = Job.fetch(job_id, connection=redis)
    except Exception:
        send_message(chat_id, f"job을 찾지 못했습니다: {job_id}")
        return

    meta = redis.hgetall(f"{REDIS_JOB_PREFIX}{job_id}")
    keyword = decode(meta.get(b"keyword")) or "unknown"
    domain = decode(meta.get(b"domain")) or "unknown"
    send_message(chat_id, format_job_message(job, keyword, domain))


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
    if name in {"/start", "/help"}:
        send_message(chat_id, usage_text())
        return
    if name == "/run":
        handle_run(redis, queue, chat_id, text)
        return
    if name == "/status":
        handle_status(redis, chat_id, text)
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
        body = format_job_message(job, keyword, domain)
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
