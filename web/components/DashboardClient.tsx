"use client";

import { useEffect, useState } from "react";

type Worker = {
  name: string;
  running: number;
  capacity: number;
};

type Schedule = {
  nextRun: string;
  frequency: string;
  trafficPerRun: number;
  workerAllocation: number;
};

type Throughput = {
  successRate: number;
  avgLatency: string;
  dailyTraffic: number;
};

type RecentJob = {
  id: string;
  keyword: string;
  status: "running" | "queued" | "done" | "failed";
  worker: string;
  eta: string;
};

type Status = {
  updatedAt: string;
  queued: number;
  running: number;
  workers: Worker[];
  queuePosition: number;
  schedule: Schedule;
  throughput?: Throughput;
  recentJobs?: RecentJob[];
};

const defaultStatus: Status = {
  updatedAt: new Date().toISOString(),
  queued: 7,
  running: 3,
  workers: [
    { name: "worker-01", running: 5, capacity: 8 },
    { name: "worker-02", running: 3, capacity: 8 },
    { name: "worker-03", running: 6, capacity: 8 },
  ],
  queuePosition: 4,
  schedule: {
    nextRun: "21:30",
    frequency: "Every 30m",
    trafficPerRun: 1200,
    workerAllocation: 4,
  },
  throughput: {
    successRate: 99.4,
    avgLatency: "1.6s",
    dailyTraffic: 12400,
  },
  recentJobs: [
    {
      id: "job-7812",
      keyword: "tiktok save.com",
      status: "running",
      worker: "worker-02",
      eta: "1m 20s",
    },
    {
      id: "job-7811",
      keyword: "keyword tracking",
      status: "queued",
      worker: "waiting",
      eta: "4m",
    },
    {
      id: "job-7810",
      keyword: "crawler audit",
      status: "done",
      worker: "worker-01",
      eta: "complete",
    },
  ],
};

export default function DashboardClient() {
  const [status, setStatus] = useState<Status>(defaultStatus);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const load = async () => {
      try {
        const res = await fetch("/api/status", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as Status;
        setStatus(data);
      } catch {
        // keep last state
      }
    };

    load();
    timer = setInterval(load, 4000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Queued</span>
            <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
              Live
            </span>
          </div>
          <div className="mt-3 text-3xl font-semibold text-zinc-900">
            {status.queued}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Running</span>
            <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
              Now
            </span>
          </div>
          <div className="mt-3 text-3xl font-semibold text-zinc-900">
            {status.running}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Workers</span>
            <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
              Active
            </span>
          </div>
          <div className="mt-3 text-3xl font-semibold text-zinc-900">
            {status.workers.length}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-800">Schedule</p>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
              {status.schedule.frequency}
            </span>
          </div>
          <div className="mt-6 space-y-4 text-xs text-zinc-600">
            <div className="flex items-center justify-between">
              <span>Next run</span>
              <span className="font-mono text-zinc-900">
                {status.schedule.nextRun}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Traffic per run</span>
              <span className="font-mono text-zinc-900">
                {status.schedule.trafficPerRun} req
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Worker allocation</span>
              <span className="font-mono text-zinc-900">
                {status.schedule.workerAllocation} pods
              </span>
            </div>
          </div>
          <div className="mt-6 grid gap-3 border-t border-zinc-100 pt-4 text-xs text-zinc-600 md:grid-cols-3">
            {[
              ["Success rate", `${status.throughput?.successRate ?? 99.4}%`],
              ["Avg latency", status.throughput?.avgLatency ?? "1.6s"],
              [
                "Daily traffic",
                `${(status.throughput?.dailyTraffic ?? 12400).toLocaleString()} req`,
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-[11px] text-zinc-500">{label}</p>
                <p className="mt-1 font-mono text-sm text-zinc-900">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-900 bg-zinc-900 p-6 text-zinc-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Queue position</p>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
              Realtime
            </span>
          </div>
          <div className="mt-6">
            <div className="text-3xl font-semibold">#{status.queuePosition}</div>
            <p className="mt-3 text-xs text-zinc-300">
              현재 {status.queuePosition}번째로 실행 중입니다. 워커가 비면 즉시
              할당됩니다.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-800">Worker load</p>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
              Live
            </span>
          </div>
          <div className="mt-6 space-y-4">
            {status.workers.map((worker) => {
              const pct = Math.round((worker.running / worker.capacity) * 100);
              return (
                <div key={worker.name} className="flex items-center gap-4">
                  <div className="w-28 text-xs font-semibold text-zinc-700">
                    {worker.name}
                  </div>
                  <div className="flex-1 rounded-full bg-zinc-100">
                    <div
                      className="h-1.5 rounded-full bg-zinc-900"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-mono text-[11px] text-zinc-500">
                    {worker.running}/{worker.capacity}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-5 text-xs text-zinc-500">
            Last sync: {new Date(status.updatedAt).toLocaleTimeString()}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-800">Recent jobs</p>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
              Live
            </span>
          </div>
          <div className="mt-4 space-y-3 text-xs">
            {(status.recentJobs ?? defaultStatus.recentJobs ?? []).map((job) => (
              <div key={job.id} className="rounded-xl border border-zinc-100 px-3 py-2">
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="font-mono">{job.id}</span>
                  <span className="uppercase tracking-[0.2em] text-[10px]">
                    {job.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-zinc-700">
                  <span className="truncate">{job.keyword}</span>
                  <span className="text-zinc-500">{job.worker}</span>
                </div>
                <div className="mt-1 text-[11px] text-zinc-500">ETA {job.eta}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
