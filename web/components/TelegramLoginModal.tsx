"use client";

import { useEffect, useRef, useState } from "react";
import { X, CheckCircle } from "lucide-react";
import PayPalButtons from "./PayPalButtons";

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface Plan {
  key: string;
  name: string;
  price: string;
  credits: number;
}

interface Props {
  plan: Plan;
  initialStep: "telegram" | "payment";
  onPaymentSuccess: () => void;
  onClose: () => void;
}

type Step = "telegram" | "payment" | "success";

export default function TelegramLoginModal({ plan, initialStep, onPaymentSuccess, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<Step>(initialStep);
  const [error, setError] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState<string | null>(null);

  // Load bot username only when on telegram step
  useEffect(() => {
    if (step !== "telegram") return;

    let cancelled = false;

    fetch("/api/telegram/config")
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text() || "Failed to load Telegram config.");
        return res.json();
      })
      .then((data: { botUsername?: string }) => {
        if (!cancelled) setBotUsername(String(data.botUsername || "").trim() || null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load Telegram config.");
      });

    return () => { cancelled = true; };
  }, [step]);

  // Inject Telegram widget
  useEffect(() => {
    if (step !== "telegram" || !botUsername || !containerRef.current) return;

    (window as unknown as Record<string, unknown>).onTelegramAuth = async (user: TelegramUser) => {
      setError(null);
      try {
        const res = await fetch("/api/telegram/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        });
        if (!res.ok) {
          setError(await res.text() || "Telegram verification failed.");
          return;
        }
        // Auth succeeded — move to payment step
        setStep("payment");
      } catch {
        setError("Telegram verification failed. Please try again.");
      }
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "8");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    script.async = true;

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(script);

    const observer = new MutationObserver(() => {
      const iframe = containerRef.current?.querySelector("iframe");
      if (iframe) {
        iframe.style.width = "100%";
        iframe.style.minWidth = "0";
        observer.disconnect();
      }
    });
    observer.observe(containerRef.current, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      delete (window as unknown as Record<string, unknown>).onTelegramAuth;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [botUsername, step]);

  function handlePaymentSuccess() {
    setStep("success");
  }

  function handlePaymentError(message: string) {
    setError(message);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={step === "success" ? undefined : onClose}
    >
      <div
        className="bg-white rounded-2xl p-8 w-full max-w-sm flex flex-col gap-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            {step === "telegram" && (
              <>
                <h2 className="text-[18px] font-bold tracking-tight text-zinc-900">Connect Telegram</h2>
                <p className="text-[13px] text-zinc-500 mt-1.5 leading-relaxed">
                  Log in with Telegram to purchase credits. Your account stays linked for future purchases.
                </p>
              </>
            )}
            {step === "payment" && (
              <>
                <h2 className="text-[18px] font-bold tracking-tight text-zinc-900">Complete Purchase</h2>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-[22px] font-bold text-zinc-900">{plan.price}</span>
                  <span className="text-[13px] text-zinc-500">· {plan.credits.toLocaleString()} credits</span>
                </div>
              </>
            )}
            {step === "success" && (
              <>
                <h2 className="text-[18px] font-bold tracking-tight text-zinc-900">Payment successful</h2>
                <p className="text-[13px] text-zinc-500 mt-1.5 leading-relaxed">
                  {plan.credits.toLocaleString()} credits will be added to your Telegram account shortly.
                </p>
              </>
            )}
          </div>
          {step !== "success" && (
            <button
              onClick={onClose}
              className="shrink-0 mt-0.5 text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Step: Telegram */}
        {step === "telegram" && (
          <>
            <div ref={containerRef} className="w-full min-h-[48px]" />
            {error ? (
              <p className="text-[12px] text-red-500 text-center">{error}</p>
            ) : !botUsername ? (
              <p className="text-[12px] text-zinc-400 text-center">Loading Telegram login…</p>
            ) : null}
            <p className="text-[11px] text-zinc-400 text-center">
              We use your Telegram account to link website checkout with your bot credits.
            </p>
          </>
        )}

        {/* Step: Payment */}
        {step === "payment" && (
          <>
            <PayPalButtons
              packageKey={plan.key}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
            {error && (
              <p className="text-[12px] text-red-500 text-center">{error}</p>
            )}
            <p className="text-[11px] text-zinc-400 text-center">
              Secured by PayPal. Credits are added within seconds of payment.
            </p>
          </>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <>
            <div className="flex justify-center py-2">
              <CheckCircle size={48} className="text-green-500" strokeWidth={1.5} />
            </div>
            <button
              onClick={onPaymentSuccess}
              className="w-full inline-flex items-center justify-center text-[13px] font-medium px-4 py-2.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 transition-colors"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}
