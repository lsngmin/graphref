export const dynamic = "force-dynamic";

function pick<T>(items: T[], index: number) {
  return items[index % items.length];
}

export async function GET() {
  const tick = Math.floor(Date.now() / 1000);
  const queued = 5 + (tick % 6);
  const running = 2 + (tick % 3);
  const queuePosition = 1 + (tick % 8);

  const workers = [
    { name: "worker-01", running: 3 + (tick % 3), capacity: 8 },
    { name: "worker-02", running: 2 + ((tick + 1) % 3), capacity: 8 },
    { name: "worker-03", running: 4 + ((tick + 2) % 3), capacity: 8 },
    { name: "worker-04", running: 1 + ((tick + 3) % 3), capacity: 8 },
  ];

  const schedule = {
    nextRun: pick(["21:30", "22:00", "22:30"], tick),
    frequency: pick(["Every 30m", "Every 1h"], tick),
    trafficPerRun: pick([800, 1200, 1800], tick),
    workerAllocation: pick([3, 4, 6], tick),
  };

  return Response.json({
    updatedAt: new Date().toISOString(),
    queued,
    running,
    workers,
    queuePosition,
    schedule,
    throughput: {
      successRate: 99.2 + ((tick % 4) * 0.1),
      avgLatency: pick(["1.4s", "1.6s", "1.9s"], tick),
      dailyTraffic: 10400 + (tick % 6) * 450,
    },
    recentJobs: [
      {
        id: `job-${1200 + (tick % 40)}`,
        keyword: "tiktok save.com",
        status: "running",
        worker: "worker-02",
        eta: "1m 10s",
      },
      {
        id: `job-${1199 + (tick % 40)}`,
        keyword: "keyword tracking",
        status: "queued",
        worker: "waiting",
        eta: "3m",
      },
      {
        id: `job-${1198 + (tick % 40)}`,
        keyword: "crawler audit",
        status: "done",
        worker: "worker-01",
        eta: "complete",
      },
    ],
  });
}
