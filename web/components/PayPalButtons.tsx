"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface PayPalButtonsProps {
  packageKey: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}

type PayPalButtonsInstance = {
  render: (el: HTMLElement) => Promise<void>;
  isEligible: () => boolean;
};

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: Record<string, unknown>) => PayPalButtonsInstance;
    };
  }
}

export default function PayPalButtons({ packageKey, onSuccess, onError }: PayPalButtonsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [sdkError, setSdkError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // Get client ID server-side (keeps it out of client bundle)
        const configRes = await fetch("/api/paypal/config");
        if (!configRes.ok) throw new Error("PayPal is not available right now.");
        const config = await configRes.json() as { clientId?: string };
        if (!config.clientId) throw new Error("PayPal is not configured.");

        // Load PayPal JS SDK (deduplicated by data attribute)
        await new Promise<void>((resolve, reject) => {
          const existing = document.querySelector("script[data-paypal-sdk]");
          if (existing) { resolve(); return; }
          const script = document.createElement("script");
          script.src = `https://www.paypal.com/sdk/js?client-id=${config.clientId}&currency=USD&intent=capture`;
          script.setAttribute("data-paypal-sdk", "1");
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load PayPal SDK."));
          document.head.appendChild(script);
        });

        if (cancelled || !containerRef.current || !window.paypal) return;

        setLoading(false);

        window.paypal.Buttons({
          style: {
            layout: "vertical",
            color: "gold",
            shape: "rect",
            label: "pay",
            height: 40,
          },
          createOrder: async () => {
            const res = await fetch("/api/paypal/create-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ packageKey }),
            });
            const data = await res.json() as { ok?: boolean; orderId?: string; error?: string };
            if (!data.ok || !data.orderId) throw new Error(data.error ?? "Failed to create order.");
            return data.orderId;
          },
          onApprove: async (data: { orderID: string }) => {
            try {
              const res = await fetch("/api/paypal/capture", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: data.orderID }),
              });
              const result = await res.json() as { ok?: boolean; error?: string };
              if (result.ok) {
                onSuccess();
              } else {
                onError(result.error ?? "Payment capture failed. Please contact support.");
              }
            } catch {
              onError("Payment capture failed. Please contact support.");
            }
          },
          onError: () => {
            onError("Payment failed. Please try again.");
          },
          // onCancel: user closed PayPal popup — just let them retry
        }).render(containerRef.current);
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load payment.";
          setSdkError(message);
          onError(message);
          setLoading(false);
        }
      }
    }

    init();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageKey]);

  return (
    <div className="w-full">
      {loading && !sdkError && (
        <div className="flex items-center justify-center py-5">
          <Loader2 size={20} className="animate-spin text-zinc-400" />
        </div>
      )}
      {sdkError && (
        <p className="text-[12px] text-red-500 text-center py-2">{sdkError}</p>
      )}
      <div ref={containerRef} className={loading ? "hidden" : ""} />
    </div>
  );
}
