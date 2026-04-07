import os
import uuid
from pathlib import Path
from typing import Any, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from redis import Redis
from rq import Queue
from rq.job import Job

from tasks import run_job

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
QUEUE_NAME = os.getenv("RQ_QUEUE", "jobs")
JOB_TIMEOUT = int(os.getenv("JOB_TIMEOUT", "1800"))

app = FastAPI()




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
