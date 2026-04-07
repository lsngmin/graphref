"use client";

import { useEffect, useState } from "react";
import TelegramConnect from "./TelegramConnect";

type Props = {
  children: React.ReactNode;
};

type MeResponse = {
  connected: boolean;
  user?: {
    username?: string;
    first_name?: string;
  };
};

export default function TelegramGate({ children }: Props) {
  const [ready, setReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/telegram/me", { cache: "no-store" });
        if (!res.ok) {
          setConnected(false);
          setReady(true);
          return;
        }
        const data = (await res.json()) as MeResponse;
        setConnected(data.connected);
        setUser(data.user?.username ?? data.user?.first_name ?? null);
      } catch {
        setConnected(false);
      } finally {
        setReady(true);
      }
    };
    load();
  }, []);

  if (!ready) return null;

  if (!connected) {
    return (
      <div className="rounded-2xl bg-zinc-100 p-6">
        <h3 className="text-sm font-semibold text-zinc-900">
          Telegram 인증 필요
        </h3>
        <p className="mt-2 text-xs text-zinc-600">
          무료 플랜 포함 모든 작업은 텔레그램 인증 후 사용할 수 있습니다.
        </p>
        <div className="mt-5">
          <TelegramConnect label="Telegram으로 시작" className="w-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
        Telegram 연결됨 · <span className="font-mono">{user ?? "@user"}</span>
      </div>
      {children}
    </div>
  );
}
