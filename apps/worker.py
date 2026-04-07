import os

from redis import Redis
from rq import Worker, Queue

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
QUEUE_NAME = os.getenv("RQ_QUEUE", "jobs")


if __name__ == "__main__":
    redis = Redis.from_url(REDIS_URL)
    q = Queue(QUEUE_NAME, connection=redis)
    Worker([q], connection=redis).work()
