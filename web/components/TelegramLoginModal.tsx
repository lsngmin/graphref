"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface Props {
  onSuccess: (username: string) => void;
  onClose: () => void;
}

export default function TelegramLoginModal({ onSuccess, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/telegram/config")
      .then(async (res) => {
        if (!res.ok) {
          const message = await res.text();
          throw new Error(message || "Failed to load Telegram config.");
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setBotUsername(String(data.botUsername || "").trim() || null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load Telegram config.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!botUsername || !containerRef.current) {
      return;
    }

    (window as unknown as Record<string, unknown>).onTelegramAuth = async (
      user: TelegramUser
    ) => {
      setError(null);

      try {
        const res = await fetch("/api/telegram/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        });

        if (!res.ok) {
          const message = await res.text();
          setError(message || "Telegram verification failed.");
          return;
        }

        const data = await res.json();
        onSuccess(data.user?.username ?? user.username ?? user.first_name);
      } catch {
        setError("Telegram verification failed. Please try again.");
      }
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    script.async = true;

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(script);

    return () => {
      delete (window as unknown as Record<string, unknown>).onTelegramAuth;
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [botUsername, onSuccess]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-8 w-full max-w-sm flex flex-col gap-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-bold tracking-tight text-zinc-900">
              Connect Telegram
            </h2>
            <p className="text-[13px] text-zinc-500 mt-1.5 leading-relaxed">
              Log in with Telegram to purchase credits. Your account stays
              linked for future purchases.
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 mt-0.5 text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div ref={containerRef} className="flex justify-center min-h-[48px]" />

        {error ? (
          <p className="text-[12px] text-red-500 text-center">{error}</p>
        ) : !botUsername ? (
          <p className="text-[12px] text-zinc-400 text-center">Loading Telegram login…</p>
        ) : null}

        <p className="text-[11px] text-zinc-400 text-center">
          We use your Telegram account to link website checkout with your bot credits.
        </p>
      </div>
    </div>
  );
}
