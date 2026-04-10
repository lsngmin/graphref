"use client";

import { useState } from "react";
import { MessageCircle, CheckCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import TelegramLoginModal from "./TelegramLoginModal";

interface Plan {
  key: string;
  name: string;
  price: string;
  credits: number;
  runs: number;
  highlight: boolean;
  features: string[];
}

interface TelegramState {
  status: "unknown" | "connected" | "disconnected";
  username?: string;
}

interface CheckoutEntry {
  loading: boolean;
  error: string | null;
}

export default function PricingCards({ plans }: { plans: Plan[] }) {
  const t = useTranslations("plans");
  const [tg, setTg] = useState<TelegramState>({ status: "unknown" });
  const [showModal, setShowModal] = useState(false);
  const [checkout, setCheckout] = useState<Record<string, CheckoutEntry>>({});

  function handleLoginSuccess(username: string) {
    setTg({ status: "connected", username });
    setShowModal(false);
  }

  async function ensureTelegramConnection(packageKey: string) {
    if (tg.status === "connected") {
      return true;
    }

    try {
      const res = await fetch("/api/telegram/me", { cache: "no-store" });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.connected) {
        setTg({ status: "connected", username: data.user?.username });
        return true;
      }

      if (res.status === 401) {
        setTg({ status: "disconnected" });
        setCheckout((prev) => ({
          ...prev,
          [packageKey]: { loading: false, error: null },
        }));
        setShowModal(true);
        return false;
      }

      setCheckout((prev) => ({
        ...prev,
        [packageKey]: {
          loading: false,
          error: data?.error ?? "Unable to verify your Telegram login right now.",
        },
      }));
      return false;
    } catch {
      setCheckout((prev) => ({
        ...prev,
        [packageKey]: {
          loading: false,
          error: "Unable to verify your Telegram login right now.",
        },
      }));
      return false;
    }
  }

  async function handleCheckout(packageKey: string) {
    setCheckout((prev) => ({
      ...prev,
      [packageKey]: { loading: true, error: null },
    }));

    const connected = await ensureTelegramConnection(packageKey);
    if (!connected) {
      return;
    }

    try {
      const res = await fetch("/api/paypal/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageKey }),
      });
      const data = await res.json();
      if (data.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setCheckout((prev) => ({
          ...prev,
          [packageKey]: {
            loading: false,
            error: data.error ?? "Something went wrong. Please try again.",
          },
        }));
      }
    } catch {
      setCheckout((prev) => ({
        ...prev,
        [packageKey]: {
          loading: false,
          error: "Something went wrong. Please try again.",
        },
      }));
    }
  }

  return (
    <>
      {showModal && (
        <TelegramLoginModal
          onSuccess={handleLoginSuccess}
          onClose={() => setShowModal(false)}
        />
      )}

      {plans.map((plan) => {
        const entry = checkout[plan.key];
        const isLoading = entry?.loading ?? false;
        const error = entry?.error ?? null;

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
              {tg.status === "disconnected" ? (
                <button
                  onClick={() => setShowModal(true)}
                  className={`inline-flex items-center justify-center gap-2 text-[13px] font-medium px-4 py-2.5 rounded-lg transition-colors ${
                    plan.highlight
                      ? "bg-white text-zinc-900 hover:bg-zinc-100"
                      : "bg-zinc-900 text-white hover:bg-zinc-700"
                  }`}
                >
                  <MessageCircle size={14} />
                  {t("connectTelegram")}
                </button>
              ) : (
                <button
                  onClick={() => handleCheckout(plan.key)}
                  disabled={isLoading}
                  className={`inline-flex items-center justify-center gap-2 text-[13px] font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                    plan.highlight
                      ? "bg-white text-zinc-900 hover:bg-zinc-100"
                      : "bg-zinc-900 text-white hover:bg-zinc-700"
                  }`}
                >
                  {isLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : null}
                  {isLoading ? t("redirecting") : t("buyNow")}
                </button>
              )}

              {error && (
                <p
                  className={`text-[12px] ${
                    plan.highlight ? "text-red-300" : "text-red-500"
                  }`}
                >
                  {error}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
