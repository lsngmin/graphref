import {
  ArrowUpRight,
  CalendarRange,
  CircleDot,
  Flag,
  Layers3,
  Sparkles,
  TimerReset,
} from "lucide-react";

import Topbar from "../../components/Topbar";

const overviewStats = [
  {
    label: "Active initiatives",
    value: "06",
    detail: "이번 분기 기준으로 동시에 추적 중인 항목",
  },
  {
    label: "On track",
    value: "04",
    detail: "일정 대비 큰 이슈 없이 진행 중",
  },
  {
    label: "At risk",
    value: "01",
    detail: "의존성 또는 범위 조정이 필요한 항목",
  },
  {
    label: "Shipped",
    value: "09",
    detail: "최근 90일 내 배포가 완료된 개선사항",
  },
];

const roadmapLanes = [
  {
    title: "Now",
    window: "April",
    tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    items: [
      {
        name: "Telegram job health dashboard",
        progress: 82,
        owner: "Ops",
        eta: "Apr 14",
        status: "Build",
      },
      {
        name: "Billing retry alerts",
        progress: 68,
        owner: "Backend",
        eta: "Apr 19",
        status: "Review",
      },
      {
        name: "Landing page conversion refresh",
        progress: 44,
        owner: "Growth",
        eta: "Apr 26",
        status: "Build",
      },
    ],
  },
  {
    title: "Next",
    window: "May",
    tone: "bg-sky-50 text-sky-700 border-sky-200",
    items: [
      {
        name: "Notion-style project roadmap",
        progress: 55,
        owner: "Frontend",
        eta: "May 03",
        status: "Spec",
      },
      {
        name: "Queue forecasting panel",
        progress: 28,
        owner: "Data",
        eta: "May 10",
        status: "Scope",
      },
      {
        name: "Worker saturation auto-scale",
        progress: 16,
        owner: "Infra",
        eta: "May 18",
        status: "Plan",
      },
    ],
  },
  {
    title: "Later",
    window: "June",
    tone: "bg-amber-50 text-amber-700 border-amber-200",
    items: [
      {
        name: "Project templates for campaign runs",
        progress: 12,
        owner: "Product",
        eta: "Jun 07",
        status: "Plan",
      },
      {
        name: "Search Console anomaly feed",
        progress: 8,
        owner: "Analytics",
        eta: "Jun 14",
        status: "Research",
      },
      {
        name: "Slack + Telegram release digest",
        progress: 4,
        owner: "Platform",
        eta: "Jun 22",
        status: "Backlog",
      },
    ],
  },
];

const projectRows = [
  {
    name: "로드맵 뷰 구축",
    team: "Frontend",
    phase: "In progress",
    phaseTone: "bg-emerald-100 text-emerald-700",
    progress: 72,
    target: "April 18",
    nextStep: "프로젝트 카드와 타임라인을 동일 데이터 소스로 정리",
  },
  {
    name: "작업 큐 예측",
    team: "Data",
    phase: "Planning",
    phaseTone: "bg-sky-100 text-sky-700",
    progress: 31,
    target: "May 02",
    nextStep: "최근 30일 처리량 기준 예측 모델 초안 작성",
  },
  {
    name: "결제 실패 재시도",
    team: "Backend",
    phase: "Review",
    phaseTone: "bg-amber-100 text-amber-700",
    progress: 84,
    target: "April 16",
    nextStep: "webhook 실패 케이스와 알림 문구 점검",
  },
  {
    name: "워커 오토스케일",
    team: "Infra",
    phase: "Blocked",
    phaseTone: "bg-rose-100 text-rose-700",
    progress: 46,
    target: "May 12",
    nextStep: "상한치 정책과 비용 가드레일 확정",
  },
];

const milestones = [
  {
    title: "Q2 theme",
    body: "운영 가시성 강화와 반복 작업 자동화에 집중",
  },
  {
    title: "Current bottleneck",
    body: "Queue forecasting 데이터 정합성 확인이 선행 조건",
  },
  {
    title: "Next release",
    body: "April 18, 2026 배포 목표로 roadmap v1 정리 중",
  },
];

const updates = [
  {
    date: "Apr 09",
    title: "Roadmap board layout locked",
    body: "노션 데이터베이스처럼 상태, 일정, 진행률을 한 화면에서 읽도록 구조를 고정했습니다.",
  },
  {
    date: "Apr 07",
    title: "Billing retry spec approved",
    body: "실패 사유별 재시도 정책과 사용자 알림 조건이 확정됐습니다.",
  },
  {
    date: "Apr 04",
    title: "Dashboard health metrics expanded",
    body: "throughput, queue position, worker saturation을 한 카드 세트로 묶었습니다.",
  },
];

function progressTone(progress: number) {
  if (progress >= 80) return "bg-emerald-500";
  if (progress >= 50) return "bg-sky-500";
  if (progress >= 25) return "bg-amber-500";
  return "bg-zinc-400";
}

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <Topbar />

      <main className="mx-auto flex w-full max-w-6xl flex-col px-6 pb-20 pt-20">
        <section className="relative overflow-hidden rounded-[32px] border border-zinc-200 bg-white px-6 py-7 shadow-sm">
          <div
            className="pointer-events-none absolute inset-0 opacity-90"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(circle at top left, rgba(14,165,233,0.12), transparent 34%), radial-gradient(circle at top right, rgba(16,185,129,0.11), transparent 32%), linear-gradient(180deg, rgba(255,255,255,0.96), rgba(244,244,245,0.92))",
            }}
          />

          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_320px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-600 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                Product Roadmap
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
                노션 프로젝트 진행상황을 한눈에 보는 로드맵.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600">
                지금 진행 중인 개발 계획, 다음 배포 순서, 프로젝트별 진행률을
                같은 화면에서 보도록 정리했습니다. 분기 단위 방향과 실무 단위
                작업이 분리되지 않게 구성한 페이지입니다.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-xs text-zinc-600">
                <div className="flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5">
                  <CalendarRange className="h-3.5 w-3.5" />
                  Quarter planning
                </div>
                <div className="flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5">
                  <Layers3 className="h-3.5 w-3.5" />
                  Initiative tracking
                </div>
                <div className="flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5">
                  <TimerReset className="h-3.5 w-3.5" />
                  Weekly updates
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-zinc-900 p-5 text-zinc-100">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                  Release Focus
                </p>
                <Flag className="h-4 w-4 text-zinc-500" />
              </div>
              <div className="mt-5 text-3xl font-semibold">v1 roadmap view</div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                프로젝트 카드, 타임라인, 진행률 테이블을 한 데이터 구조로
                묶어 이번 스프린트에서 우선 배포합니다.
              </p>
              <div className="mt-5 space-y-3 text-xs text-zinc-300">
                <div className="flex items-center justify-between">
                  <span>Target ship</span>
                  <span className="font-mono text-zinc-100">Apr 18</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Owner</span>
                  <span className="font-mono text-zinc-100">Frontend</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Confidence</span>
                  <span className="font-mono text-zinc-100">0.84</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {overviewStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                {stat.label}
              </p>
              <div className="mt-3 text-3xl font-semibold text-zinc-900">
                {stat.value}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                {stat.detail}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Timeline
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-zinc-900">
                  분기 로드맵
                </h2>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 text-[11px] font-medium text-zinc-600">
                <CircleDot className="h-3.5 w-3.5" />
                Weekly synced structure
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {roadmapLanes.map((lane) => (
                <div
                  key={lane.title}
                  className="rounded-3xl border border-zinc-200 bg-zinc-50/80 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900">
                        {lane.title}
                      </h3>
                      <p className="mt-1 text-xs text-zinc-500">{lane.window}</p>
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${lane.tone}`}
                    >
                      {lane.items.length} items
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {lane.items.map((item) => (
                      <div
                        key={item.name}
                        className="rounded-2xl border border-zinc-200 bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-zinc-900">
                              {item.name}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {item.owner} · ETA {item.eta}
                            </p>
                          </div>
                          <span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                            {item.status}
                          </span>
                        </div>
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-[11px] text-zinc-500">
                            <span>Progress</span>
                            <span className="font-mono text-zinc-700">
                              {item.progress}%
                            </span>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-zinc-100">
                            <div
                              className={`h-2 rounded-full ${progressTone(item.progress)}`}
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Snapshot
              </p>
              <div className="mt-5 space-y-4">
                {milestones.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-zinc-200 bg-zinc-900 p-6 text-zinc-100 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                  Status Cue
                </p>
                <ArrowUpRight className="h-4 w-4 text-zinc-500" />
              </div>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                  <span className="text-zinc-300">Build velocity</span>
                  <span className="font-mono text-zinc-100">+18%</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                  <span className="text-zinc-300">Spec churn</span>
                  <span className="font-mono text-zinc-100">Low</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                  <span className="text-zinc-300">Blocking items</span>
                  <span className="font-mono text-zinc-100">1</span>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
          <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Projects
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-zinc-900">
                  실행 단위별 진행 테이블
                </h2>
              </div>
              <div className="rounded-full bg-zinc-100 px-3 py-1.5 text-[11px] font-medium text-zinc-600">
                Notion database style
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-zinc-200">
              <div className="hidden grid-cols-[1.2fr_0.8fr_0.9fr_0.8fr_1.5fr] gap-4 bg-zinc-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 md:grid">
                <span>Project</span>
                <span>Team</span>
                <span>Status</span>
                <span>Target</span>
                <span>Next step</span>
              </div>

              <div className="divide-y divide-zinc-200">
                {projectRows.map((row) => (
                  <div
                    key={row.name}
                    className="grid gap-4 px-4 py-4 md:grid-cols-[1.2fr_0.8fr_0.9fr_0.8fr_1.5fr] md:items-center"
                  >
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">
                        {row.name}
                      </p>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] text-zinc-500">
                          <span>Progress</span>
                          <span className="font-mono text-zinc-700">
                            {row.progress}%
                          </span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-zinc-100">
                          <div
                            className={`h-2 rounded-full ${progressTone(row.progress)}`}
                            style={{ width: `${row.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-zinc-600">{row.team}</div>
                    <div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${row.phaseTone}`}
                      >
                        {row.phase}
                      </span>
                    </div>
                    <div className="font-mono text-sm text-zinc-700">
                      {row.target}
                    </div>
                    <div className="text-sm leading-relaxed text-zinc-600">
                      {row.nextStep}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Updates
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-zinc-900">
                  최근 변경사항
                </h2>
              </div>
              <div className="rounded-full bg-zinc-100 px-3 py-1.5 text-[11px] font-medium text-zinc-600">
                Weekly log
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {updates.map((update) => (
                <div
                  key={update.title}
                  className="rounded-3xl border border-zinc-200 bg-zinc-50 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-zinc-900">
                      {update.title}
                    </p>
                    <span className="font-mono text-[11px] text-zinc-500">
                      {update.date}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    {update.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
