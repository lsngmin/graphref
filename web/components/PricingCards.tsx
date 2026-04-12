"use client";

import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import TelegramLoginModal from "./TelegramLoginModal";

function PayPalBadge({ light = false }: { light?: boolean }) {
  const payColor  = light ? "rgba(255,255,255,0.85)" : "#253B80";
  const palColor  = light ? "rgba(255,255,255,0.55)" : "#179BD7";
  return (
    <svg viewBox="0 0 52 14" width="44" height="12" aria-label="PayPal" role="img">
      <text y="12" fontFamily="Arial, Helvetica, sans-serif" fontWeight="bold" fontSize="13">
        <tspan fill={payColor}>Pay</tspan>
        <tspan fill={palColor}>Pal</tspan>
      </text>
    </svg>
  );
}

interface Plan {
  key: string;
  name: string;
  price: string;
  credits: number;
  runs: number;
  highlight: boolean;
  features: string[];
}

type TgStatus = "unknown" | "connected" | "disconnected";

export default function PricingCards({ plans }: { plans: Plan[] }) {
  const t = useTranslations("plans");
  const [tgStatus, setTgStatus] = useState<TgStatus>("unknown");
  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);
  const [checkingKey, setCheckingKey] = useState<string | null>(null);

  async function handleBuy(plan: Plan) {
    if (tgStatus === "connected") {
      setPendingPlan(plan);
      return;
    }

    // Check cookies server-side before opening modal
    setCheckingKey(plan.key);
    try {
      const res = await fetch("/api/telegram/me", { cache: "no-store" });
      const data = await res.json().catch(() => null) as { connected?: boolean; user?: { username?: string } } | null;
      if (res.ok && data?.connected) {
        setTgStatus("connected");
      } else {
        setTgStatus("disconnected");
      }
    } catch {
      setTgStatus("disconnected");
    }
    setCheckingKey(null);
    setPendingPlan(plan);
  }

  function handleModalClose() {
    setPendingPlan(null);
  }

  function handlePaymentSuccess() {
    setPendingPlan(null);
  }

  return (
    <>
      {pendingPlan && (
        <TelegramLoginModal
          plan={pendingPlan}
          initialStep={tgStatus === "connected" ? "payment" : "telegram"}
          onPaymentSuccess={handlePaymentSuccess}
          onClose={handleModalClose}
        />
      )}

      {plans.map((plan) => {
        const isChecking = checkingKey === plan.key;

        return (
          <div
            key={plan.key}
            className={`rounded-xl border p-6 flex flex-col gap-4 ${
              plan.highlight
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-900"
            }`}
          >
            <div>
              <p className="text-[13px] font-medium mb-3 text-zinc-400">
                {t(`${plan.key}.name`)}
              </p>
              <p className="text-[32px] font-bold tracking-tight leading-none mb-1">
                {plan.price}
              </p>
              <p
                className={`text-[13px] mt-2 ${
                  plan.highlight ? "text-zinc-400" : "text-zinc-500"
                }`}
              >
                {t("credits", { count: plan.credits.toLocaleString() })}
              </p>
            </div>

            <ul className="flex flex-col gap-2">
              {plan.features.map((_, i) => (
                <li key={i} className="flex items-center gap-2 text-[13px]">
                  <CheckCircle size={13} className="shrink-0 text-zinc-400" />
                  <span
                    className={
                      plan.highlight ? "text-zinc-300" : "text-zinc-600"
                    }
                  >
                    {t(`${plan.key}.features.${i}`)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-auto flex flex-col gap-2">
              <button
                onClick={() => handleBuy(plan)}
                disabled={isChecking}
                className={`inline-flex items-center justify-center gap-2 text-[13px] font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                  plan.highlight
                    ? "bg-white text-zinc-900 hover:bg-zinc-100"
                    : "bg-zinc-900 text-white hover:bg-zinc-700"
                }`}
              >
                {isChecking ? <Loader2 size={14} className="animate-spin" /> : null}
                {t("buyNow")}
              </button>

              <div className={`flex items-center justify-center gap-1 pt-0.5 ${plan.highlight ? "opacity-50" : "opacity-40"}`}>
                <span className={`text-[10px] ${plan.highlight ? "text-zinc-300" : "text-zinc-500"}`}>via</span>
                <PayPalBadge light={plan.highlight} />
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
