import Topbar from "../../components/Topbar";
import TelegramGate from "../../components/TelegramGate";
import DashboardClient from "../../components/DashboardClient";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <Topbar />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pt-20">
        <section className="mb-10 grid gap-6 md:grid-cols-[minmax(0,1fr)_320px] md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Dashboard
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
              실시간 실행 현황을 한 화면에.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-600">
              스케줄당 트래픽, 워커 배정, 현재 작업 순번을 동시에 확인합니다.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-xs text-zinc-600">
            <div className="flex items-center justify-between">
              <span className="font-medium text-zinc-700">Workspace</span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                Active
              </span>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span>Current plan</span>
                <span className="font-mono text-zinc-900">Pro</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Next schedule</span>
                <span className="font-mono text-zinc-900">21:30</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Queue SLA</span>
                <span className="font-mono text-zinc-900">2m 10s</span>
              </div>
            </div>
          </div>
        </section>

        <TelegramGate>
          <DashboardClient />
        </TelegramGate>

        <footer className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 py-6 text-xs text-zinc-500">
          <span>Realtime queue & schedule control</span>
          <span className="font-mono">v0.1</span>
        </footer>
      </main>
    </div>
  );
}
