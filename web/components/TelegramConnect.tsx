"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  label?: string;
  redirectTo?: string;
  className?: string;
  radius?: number;
};

declare global {
  interface Window {
    onTelegramAuth?: (user: Record<string, unknown>) => void;
  }
}

export default function TelegramConnect({
  label = "Connect Telegram",
  redirectTo = "/dashboard",
  className = "btn btn-primary",
  radius = 12,
}: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
    if (!botUsername || !containerRef.current) return;

    window.onTelegramAuth = async (user) => {
      const res = await fetch("/api/telegram/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      if (res.ok) {
        router.push(redirectTo);
      }
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", String(radius));
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [radius, redirectTo, router]);

  const botMissing = !process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  if (botMissing) {
    return (
      <Button type="button" className={className} disabled>
        {label}
      </Button>
    );
  }

  return (
    <div>
      <div ref={containerRef} />
      <noscript>
        <button type="button" className={className}>
          {label}
        </button>
      </noscript>
    </div>
  );
}
