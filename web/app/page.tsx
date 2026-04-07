import Link from "next/link";
import Topbar from "../components/Topbar";
import { Button } from "@/components/ui/button";
import TelegramConnect from "../components/TelegramConnect";

export default function HomePage() {
  const featureItems = [
    {
      title: "Schedule-driven traffic",
      description:
        "스케줄 단위로 트래픽을 분배하고 워커 할당을 고정해 반복 실행에 최적화합니다.",
    },
    {
      title: "Queue visibility",
      description:
        "현재 몇 번째 작업인지, 대기열이 얼마나 남았는지 한 화면에서 확인합니다.",
    },
    {
      title: "Telegram-only access",
      description:
        "이메일 인증 없이 Telegram 하나로 인증을 통일하고, 무료 플랜도 동일한 흐름으로 시작합니다.",
    },
  ];

  const flowItems = [
    {
      step: "01",
      title: "Connect Telegram",
      description: "텔레그램 인증으로 워크스페이스 접근을 활성화합니다.",
    },
    {
      step: "02",
      title: "Define schedule",
      description: "스케줄마다 트래픽과 워커 수를 지정합니다.",
    },
    {
      step: "03",
      title: "Monitor queue",
      description: "실시간으로 작업 순번과 워커 상태를 추적합니다.",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <Topbar />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-24 px-6 pb-24 pt-24 md:gap-28 md:pt-28">
        <section className="grid gap-8 md:grid-cols-[minmax(0,1fr)_340px] md:items-end">
          <div className="max-w-3xl space-y-6">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
              Orchestrate search traffic like a product team.
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-zinc-600 md:text-lg">
              GrapHref는 스케줄 기반 트래픽 분배와 워커 실행을 통합해 줍니다.
              큐 위치와 실행 현황을 실시간으로 모니터링하세요.
            </p>
            <div className="flex flex-wrap gap-3">
              <TelegramConnect label="Telegram으로 시작" className="w-full sm:w-auto" />
              <Button variant="secondary" asChild>
                <Link href="/pricing">요금제 보기</Link>
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl bg-zinc-900 p-6 text-zinc-100">
              <p className="text-sm text-zinc-400">Live snapshot</p>
              <pre className="mt-3 overflow-x-auto text-xs leading-6">
                <code>{`NEXT RUN  21:30
TRAFFIC   1,200 req
WORKERS   4 pods
QUEUE     #3 running`}</code>
              </pre>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Today at a glance</span>
                <span className="font-mono text-[11px] text-zinc-600">
                  Updated 21:12
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-zinc-500">Scheduled runs</p>
                  <p className="mt-1 text-lg font-semibold text-zinc-900">8</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Success rate</p>
                  <p className="mt-1 text-lg font-semibold text-zinc-900">99.4%</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Queue depth</p>
                  <p className="mt-1 text-lg font-semibold text-zinc-900">12</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Active workers</p>
                  <p className="mt-1 text-lg font-semibold text-zinc-900">4</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Why teams choose GrapHref
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {featureItems.map((feature) => (
              <article key={feature.title} className="rounded-2xl bg-zinc-100 p-6">
                <h3 className="text-lg font-semibold tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-800">Schedule preview</p>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                Next 6h
              </span>
            </div>
            <div className="mt-5 space-y-3 text-xs text-zinc-600">
              {[
                ["21:30", "1,200 req", "4 workers"],
                ["22:00", "900 req", "3 workers"],
                ["22:30", "1,500 req", "5 workers"],
              ].map((row) => (
                <div key={row[0]} className="flex items-center justify-between">
                  <span className="font-mono text-zinc-900">{row[0]}</span>
                  <span>{row[1]}</span>
                  <span>{row[2]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-800">Queue snapshot</p>
              <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                Realtime
              </span>
            </div>
            <div className="mt-5 space-y-3 text-xs text-zinc-600">
              {[
                ["#3", "tiktok save.com", "worker-02"],
                ["#4", "keyword tracking", "worker-01"],
                ["#5", "queue audit", "waiting"],
              ].map((row) => (
                <div key={row[0]} className="flex items-center justify-between">
                  <span className="font-mono text-zinc-900">{row[0]}</span>
                  <span className="truncate">{row[1]}</span>
                  <span className="text-zinc-500">{row[2]}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            How it works
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {flowItems.map((flow) => (
              <article key={flow.step} className="rounded-2xl bg-white p-6">
                <p className="text-sm font-medium text-zinc-500">{flow.step}</p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight">
                  {flow.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  {flow.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-zinc-900 px-8 py-10 text-zinc-100 md:px-10 md:py-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Ready to launch your next schedule?
              </h2>
              <p className="text-sm leading-relaxed text-zinc-300 md:text-base">
                Telegram 인증 후 무료 플랜으로 시작하거나, 바로 유료 플랜으로
                확장하세요.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" asChild>
                <Link href="/pricing">Pricing</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
