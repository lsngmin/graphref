import asyncio
import html
import logging
import os
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, List, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from redis import Redis
from rq import Queue
from rq.job import Job
from decimal import Decimal, ROUND_HALF_UP

try:
    from paypal import (
        PayPalError,
        capture_order as capture_paypal_order,
        fetch_order as fetch_paypal_order,
        get_package_credits,
        parse_custom_id,
        verify_webhook_event as verify_paypal_webhook_event,
    )
except ModuleNotFoundError:
    from apps.paypal import (
        PayPalError,
        capture_order as capture_paypal_order,
        fetch_order as fetch_paypal_order,
        get_package_credits,
        parse_custom_id,
        verify_webhook_event as verify_paypal_webhook_event,
    )

try:
    from supabase_store import SupabaseStore
except ModuleNotFoundError:
    from apps.supabase_store import SupabaseStore

try:
    from tasks import run_job
except ModuleNotFoundError:
    from apps.tasks import run_job

try:
    from telegram_bot import (
        get_redis as get_bot_redis,
        get_queue as get_bot_queue,
        notify_completed_jobs,
        process_callback_query,
        process_message,
    )
except ModuleNotFoundError:
    from apps.telegram_bot import (
        get_redis as get_bot_redis,
        get_queue as get_bot_queue,
        notify_completed_jobs,
        process_callback_query,
        process_message,
    )

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
QUEUE_NAME = os.getenv("RQ_QUEUE", "jobs")
JOB_TIMEOUT = int(os.getenv("JOB_TIMEOUT", "1800"))
TELEGRAM_WEBHOOK_SECRET = os.getenv("TELEGRAM_WEBHOOK_SECRET", "")


async def _notify_loop() -> None:
    """Background task: poll completed RQ jobs and notify users via Telegram."""
    redis = get_bot_redis()
    while True:
        try:
            await asyncio.to_thread(notify_completed_jobs, redis)
        except Exception:
            logger.error("notify_completed_jobs error", exc_info=True)
        await asyncio.sleep(5)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(_notify_loop())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(lifespan=lifespan)




class JobPayload(BaseModel):
    search_keyword: str
    target_domain: str


class JobsRequest(BaseModel):
    job: Optional[JobPayload] = None
    jobs: Optional[List[JobPayload]] = None


def get_redis() -> Redis:
    return Redis.from_url(REDIS_URL)


def get_queue() -> Queue:
    return Queue(QUEUE_NAME, connection=get_redis())


def serialize_job(rq_job: Job) -> dict[str, Any]:
    return {
        "id": rq_job.id,
        "status": rq_job.get_status(refresh=True),
        "args": rq_job.args,
        "result": rq_job.result,
        "exc_info": rq_job.exc_info[-4000:] if rq_job.exc_info else None,
        "enqueued_at": rq_job.enqueued_at.isoformat() if rq_job.enqueued_at else None,
        "started_at": rq_job.started_at.isoformat() if rq_job.started_at else None,
        "ended_at": rq_job.ended_at.isoformat() if rq_job.ended_at else None,
    }


@app.get("/healthz")
def healthz():
    redis = get_redis()
    redis.ping()
    return {"ok": True, "queue": QUEUE_NAME}


def get_user_store() -> SupabaseStore:
    return SupabaseStore.from_env()


def ensure_user_exists(chat_id: str, source: str = "payment") -> None:
    store = get_user_store()
    if store.get_user(chat_id) is None:
        store.register_user(
            chat_id,
            initial_credits=50,
            reason="signup_bonus",
            metadata={"source": source},
        )


def _money_to_minor_units(value: str) -> int:
    amount = Decimal(str(value or "0")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return int(amount * 100)


def _record_paypal_order(order: dict, raw: Optional[dict] = None) -> tuple[bool, int]:
    order_id = str(order.get("id") or "").strip()
    purchase_units = order.get("purchase_units") or []
    if not order_id or not purchase_units:
        raise HTTPException(status_code=400, detail="Invalid PayPal order payload")

    purchase_unit = purchase_units[0] or {}
    custom_id = str(purchase_unit.get("custom_id") or "").strip()
    if not custom_id:
        raise HTTPException(status_code=400, detail="Missing PayPal custom_id")

    try:
        chat_id, package_key = parse_custom_id(custom_id)
        credits = get_package_credits(package_key)
    except PayPalError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    payments = purchase_unit.get("payments") or {}
    captures = payments.get("captures") or []
    if not captures:
        raise HTTPException(status_code=400, detail="Missing PayPal capture")

    capture = captures[-1] or {}
    amount = capture.get("amount") or purchase_unit.get("amount") or {}
    currency = str(amount.get("currency_code") or "")
    total = _money_to_minor_units(str(amount.get("value") or "0"))
    capture_id = str(capture.get("id") or "").strip()
    payer = order.get("payer") or {}
    user_email = payer.get("email_address")
    status = str(capture.get("status") or order.get("status") or "").strip()

    ensure_user_exists(chat_id, source="paypal_payment")
    return get_user_store().record_paypal_order(
        order_id=order_id,
        chat_id=chat_id,
        package_key=package_key,
        credits_added=credits,
        capture_id=capture_id,
        user_email=user_email,
        currency=currency,
        total=total,
        status=status,
        raw=raw or order,
    )


@app.post("/jobs")
def create_jobs(payload: JobsRequest):
    jobs = payload.jobs or ([payload.job] if payload.job else [])
    if not jobs:
        raise HTTPException(status_code=400, detail="No jobs provided")

    batch_id = f"batch_{uuid.uuid4().hex}"
    q = get_queue()

    job_ids: List[str] = []
    for job in jobs:
        rq_job = q.enqueue(run_job, job.dict(), job_timeout=JOB_TIMEOUT)
        job_ids.append(rq_job.id)

    return {"batch_id": batch_id, "job_ids": job_ids}


@app.post("/paypal/webhook")
async def paypal_webhook(request: Request):
    payload = await request.json()

    try:
        verified = verify_paypal_webhook_event(request.headers, payload)
    except PayPalError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if not verified:
        raise HTTPException(status_code=401, detail="Invalid PayPal webhook signature")

    event_type = str(payload.get("event_type") or "")
    if event_type == "CHECKOUT.ORDER.APPROVED":
        resource = payload.get("resource") or {}
        order_id = str(resource.get("id") or "").strip()
        if not order_id:
            raise HTTPException(status_code=400, detail="Missing PayPal order_id")

        try:
            order = capture_paypal_order(order_id)
        except PayPalError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc

        applied, balance = _record_paypal_order(order, raw=payload)
        return {
            "ok": True,
            "captured": True,
            "applied": applied,
            "balance": balance,
            "order_id": order_id,
        }

    if event_type != "PAYMENT.CAPTURE.COMPLETED":
        return {"ok": True, "ignored": event_type}

    resource = payload.get("resource") or {}
    related_ids = (resource.get("supplementary_data") or {}).get("related_ids") or {}
    order_id = str(related_ids.get("order_id") or "").strip()
    if not order_id:
        raise HTTPException(status_code=400, detail="Missing PayPal order_id")

    try:
        order = fetch_paypal_order(order_id)
    except PayPalError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    applied, balance = _record_paypal_order(order, raw=payload)
    return {"ok": True, "applied": applied, "balance": balance}

@app.post("/webhook/telegram")
async def telegram_webhook(request: Request):
    if TELEGRAM_WEBHOOK_SECRET:
        token = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
        if token != TELEGRAM_WEBHOOK_SECRET:
            raise HTTPException(status_code=401, detail="Invalid webhook secret")

    update = await request.json()
    redis = get_bot_redis()
    queue = get_bot_queue(redis)

    try:
        if update.get("callback_query"):
            await asyncio.to_thread(process_callback_query, redis, update["callback_query"])
        elif update.get("message"):
            await asyncio.to_thread(process_message, redis, queue, update["message"])
    except Exception:
        logger.error("telegram webhook handler error", exc_info=True)

    # Always return 200 — Telegram will retry on non-2xx
    return {"ok": True}


@app.get("/jobs/{job_id}")
def get_job(job_id: str):
    try:
        rq_job = Job.fetch(job_id, connection=get_redis())
    except Exception as exc:
        raise HTTPException(status_code=404, detail=f"Job not found: {job_id}") from exc

    return serialize_job(rq_job)


@app.get("/", response_class=HTMLResponse)
def index():
    path = Path(__file__).resolve().parent / "index.html"
    if not path.exists():
        return "<h1>index.html not found</h1>"
    return path.read_text(encoding="utf-8")
