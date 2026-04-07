import Link from "next/link";
import TelegramConnect from "../../components/TelegramConnect";
import Topbar from "../../components/Topbar";
import { Button } from "@/components/ui/button";
import { createCheckout } from "../actions/checkout";

export default function PricingPage() {
  const proVariant = process.env.LEMON_SQUEEZY_VARIANT_PRO ?? "";
  const scaleVariant = process.env.LEMON_SQUEEZY_VARIANT_SCALE ?? "";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <Topbar />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-24 pt-24">
        <section className="grid gap-8 md:grid-cols-[minmax(0,1fr)_320px] md:items-end">
          <div className="max-w-3xl space-y-6">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Pricing built for high-volume traffic.
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-zinc-600">
              무료 플랜은 텔레그램 인증 후 즉시 시작합니다. 유료 플랜은
              스케줄/트래픽/워커 수를 확장해 팀 단위 운영에 맞춰집니다.
            </p>
            <div className="flex flex-wrap gap-3">
              <TelegramConnect label="Start free" className="w-full sm:w-auto" />
              <Button variant="secondary" asChild>
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-2xl bg-zinc-900 p-6 text-zinc-100">
            <p className="text-sm text-zinc-400">Billing snapshot</p>
            <div className="mt-4 space-y-3 text-xs text-zinc-300">
              <div className="flex items-center justify-between">
                <span>Payment flow</span>
                <span className="font-mono text-white">Server action</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Auth</span>
                <span className="font-mono text-white">Telegram only</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Test mode</span>
                <span className="font-mono text-white">ENV control</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <p className="text-sm font-semibold text-zinc-900">Free</p>
            <p className="mt-2 text-xs text-zinc-600">
              최대 1,000 트래픽/주 · 워커 1개
            </p>
            <div className="mt-6 text-3xl font-semibold">₩0</div>
            <ul className="mt-4 space-y-2 text-xs text-zinc-600">
              <li>Telegram 인증 필수</li>
              <li>스케줄 1개</li>
              <li>실시간 큐 위치 확인</li>
            </ul>
            <div className="mt-6">
              <TelegramConnect label="Start free" className="w-full" />
            </div>
          </div>

          <div className="relative rounded-2xl border border-zinc-900 bg-zinc-900 p-6 text-zinc-100">
            <span className="absolute -top-3 left-6 rounded-full bg-zinc-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
              Most popular
            </span>
            <p className="text-sm font-semibold">Pro</p>
            <p className="mt-2 text-xs text-zinc-300">
              최대 50,000 트래픽/월 · 워커 6개
            </p>
            <div className="mt-6 text-3xl font-semibold">₩79,000</div>
            <ul className="mt-4 space-y-2 text-xs text-zinc-300">
              <li>스케줄 10개</li>
              <li>실시간 작업 히스토리</li>
              <li>우선 워커 배정</li>
            </ul>
            <form action={createCheckout} className="mt-6">
              <input type="hidden" name="plan" value="pro" />
              <input type="hidden" name="variantId" value={proVariant} />
              <Button
                type="submit"
                variant="secondary"
                className="w-full"
                disabled={!proVariant}
              >
                Upgrade to Pro
              </Button>
            </form>
            {!proVariant && (
              <p className="mt-3 text-[11px] text-zinc-400">
                LEMON_SQUEEZY_VARIANT_PRO 설정 필요
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <p className="text-sm font-semibold text-zinc-900">Scale</p>
            <p className="mt-2 text-xs text-zinc-600">
              최대 200,000 트래픽/월 · 워커 20개
            </p>
            <div className="mt-6 text-3xl font-semibold">₩199,000</div>
            <ul className="mt-4 space-y-2 text-xs text-zinc-600">
              <li>무제한 스케줄</li>
              <li>전담 큐 모니터링</li>
              <li>프리미엄 우선 처리</li>
            </ul>
            <form action={createCheckout} className="mt-6">
              <input type="hidden" name="plan" value="scale" />
              <input type="hidden" name="variantId" value={scaleVariant} />
              <Button
                type="submit"
                className="w-full"
                disabled={!scaleVariant}
              >
                Upgrade to Scale
              </Button>
            </form>
            {!scaleVariant && (
              <p className="mt-3 text-[11px] text-zinc-500">
                LEMON_SQUEEZY_VARIANT_SCALE 설정 필요
              </p>
            )}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <p className="text-sm font-semibold text-zinc-900">What’s included</p>
            <ul className="mt-4 space-y-2 text-xs text-zinc-600">
              <li>스케줄별 트래픽 제한 + 워커 배정</li>
              <li>큐 순번, 작업 히스토리, 실패 로그 요약</li>
              <li>Telegram 인증 단일 플로우</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <p className="text-sm font-semibold text-zinc-900">Billing notes</p>
            <ul className="mt-4 space-y-2 text-xs text-zinc-600">
              <li>카드 결제 및 영수증 발행은 Lemon Squeezy에서 처리</li>
              <li>플랜 변경 즉시 워커/트래픽 한도 반영</li>
              <li>무료 플랜도 Telegram 인증 후 바로 시작 가능</li>
            </ul>
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 py-6 text-xs text-zinc-500">
          <span>All plans require Telegram authentication</span>
          <span className="font-mono">Billing via Lemon Squeezy</span>
        </footer>
      </main>
    </div>
  );
}
