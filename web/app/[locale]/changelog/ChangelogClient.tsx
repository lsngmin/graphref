"use client";

import { useMemo, useState } from "react";
import type { ElementType } from "react";
import { Zap, Bug, Wrench, Sparkles } from "lucide-react";

type EntryType = "feature" | "fix" | "improvement" | "bot";

type ChangelogEntry = {
  version: string;
  date: string;
  items: {
    type: EntryType;
    text: string;
  }[];
};

const typeConfig: Record<EntryType, { label: string; color: string; bg: string; Icon: ElementType }> = {
  feature: { label: "New", color: "text-violet-600", bg: "bg-violet-50 border-violet-200", Icon: Sparkles },
  fix: { label: "Fix", color: "text-red-500", bg: "bg-red-50 border-red-200", Icon: Bug },
  improvement: { label: "Improvement", color: "text-blue-600", bg: "bg-blue-50 border-blue-200", Icon: Wrench },
  bot: { label: "Bot", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", Icon: Zap },
};

const entries: ChangelogEntry[] = [
  {
    version: "v0.9.2",
    date: "2026-04-11",
    items: [
      { type: "bot", text: "Auto-refund now triggers within 5 seconds of job failure instead of on next worker cycle." },
      { type: "improvement", text: "/jobs command now shows timestamps alongside each entry." },
      { type: "fix", text: "Fixed edge case where canceled jobs occasionally showed status: started in /status." },
    ],
  },
  {
    version: "v0.9.1",
    date: "2026-03-28",
    items: [
      { type: "feature", text: "Referral program launched — earn 30 credits per friend who runs their first job." },
      { type: "bot", text: "/queue now shows your active job count alongside global queue depth." },
      { type: "fix", text: "Resolved timeout handling bug that left some jobs stuck in started state indefinitely." },
    ],
  },
  {
    version: "v0.9.0",
    date: "2026-03-10",
    items: [
      { type: "feature", text: "Multi-language bot support — responses now available in English, Korean, Russian, and Spanish." },
      { type: "improvement", text: "Worker pool expanded. Average queue time reduced by ~40%." },
      { type: "improvement", text: "Credit balance shown after every /run confirmation." },
    ],
  },
  {
    version: "v0.8.5",
    date: "2026-02-18",
    items: [
      { type: "bot", text: "/cancel command added — cancel any queued job and receive an instant refund." },
      { type: "fix", text: "Fixed rare race condition where two workers could pick up the same job." },
      { type: "improvement", text: "Improved Google search simulation to better match organic click patterns." },
    ],
  },
  {
    version: "v0.8.0",
    date: "2026-01-30",
    items: [
      { type: "feature", text: "Initial public launch. /run, /status, /jobs, /credits, /queue commands available." },
      { type: "bot", text: "Redis-backed job queue with automatic retry and refund on failure." },
    ],
  },
];

export default function ChangelogClient() {
  const [selectedVersion, setSelectedVersion] = useState(entries[0]?.version ?? "");

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.version === selectedVersion) ?? entries[0],
    [selectedVersion],
  );

  if (!selectedEntry) {
    return null;
  }

  return (
    <section className="py-16 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)] gap-8 lg:gap-12">
        <aside className="md:sticky md:top-28 h-fit">
          <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-zinc-400 mb-3">Releases</p>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-2">
            {entries.map((entry, idx) => {
              const isActive = entry.version === selectedEntry.version;
              return (
                <button
                  key={entry.version}
                  type="button"
                  onClick={() => setSelectedVersion(entry.version)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
                    isActive ? "bg-white border border-zinc-200 shadow-sm" : "border border-transparent hover:bg-white/80"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-mono font-semibold text-zinc-900">{entry.version}</span>
                    {idx === 0 && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-zinc-900 text-white">Latest</span>}
                  </div>
                  <p className="mt-0.5 text-[11px] text-zinc-500">{entry.date}</p>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7">
          <div className="flex items-center gap-3 mb-6 border-b border-zinc-100 pb-4">
            <h2 className="text-[22px] font-bold tracking-tight text-zinc-900 font-mono">{selectedEntry.version}</h2>
            <span className="text-[12px] text-zinc-500">{selectedEntry.date}</span>
          </div>

          <div className="space-y-3">
            {selectedEntry.items.map((item, i) => {
              const cfg = typeConfig[item.type];
              const Icon = cfg.Icon;
              return (
                <div key={`${selectedEntry.version}-${i}`} className="flex items-start gap-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold shrink-0 mt-0.5 ${cfg.bg} ${cfg.color}`}
                  >
                    <Icon size={10} />
                    {cfg.label}
                  </span>
                  <p className="text-[13px] text-zinc-600 leading-relaxed">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="mt-12 text-[12px] text-zinc-400 text-center">
        Older versions are not listed. Bot updates are applied automatically.
      </p>
    </section>
  );
}
