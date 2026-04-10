import MarketingHeader from "@/components/MarketingHeader";
import { Zap, Bug, Wrench, Sparkles } from "lucide-react";

export const metadata = {
  title: "Changelog — Graphref",
  description: "What's new in Graphref — updates, fixes, and improvements to the bot.",
};

type EntryType = "feature" | "fix" | "improvement" | "bot";

const typeConfig: Record<EntryType, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  feature:     { label: "New",         color: "text-violet-600", bg: "bg-violet-50 border-violet-200", Icon: Sparkles },
  fix:         { label: "Fix",         color: "text-red-500",    bg: "bg-red-50 border-red-200",       Icon: Bug },
  improvement: { label: "Improvement", color: "text-blue-600",   bg: "bg-blue-50 border-blue-200",     Icon: Wrench },
  bot:         { label: "Bot",         color: "text-emerald-600",bg: "bg-emerald-50 border-emerald-200", Icon: Zap },
};

const entries = [
  {
    version: "v0.9.2",
    date: "2026-04-11",
    items: [
      { type: "bot" as EntryType,         text: "Auto-refund now triggers within 5 seconds of job failure instead of on next worker cycle." },
      { type: "improvement" as EntryType, text: "/jobs command now shows timestamps alongside each entry." },
      { type: "fix" as EntryType,         text: "Fixed edge case where canceled jobs occasionally showed status: started in /status." },
    ],
  },
  {
    version: "v0.9.1",
    date: "2026-03-28",
    items: [
      { type: "feature" as EntryType,     text: "Referral program launched — earn 30 credits per friend who runs their first job." },
      { type: "bot" as EntryType,         text: "/queue now shows your active job count alongside global queue depth." },
      { type: "fix" as EntryType,         text: "Resolved timeout handling bug that left some jobs stuck in started state indefinitely." },
    ],
  },
  {
    version: "v0.9.0",
    date: "2026-03-10",
    items: [
      { type: "feature" as EntryType,     text: "Multi-language bot support — responses now available in English, Korean, Russian, and Spanish." },
      { type: "improvement" as EntryType, text: "Worker pool expanded. Average queue time reduced by ~40%." },
      { type: "improvement" as EntryType, text: "Credit balance shown after every /run confirmation." },
    ],
  },
  {
    version: "v0.8.5",
    date: "2026-02-18",
    items: [
      { type: "bot" as EntryType,         text: "/cancel command added — cancel any queued job and receive an instant refund." },
      { type: "fix" as EntryType,         text: "Fixed rare race condition where two workers could pick up the same job." },
      { type: "improvement" as EntryType, text: "Improved Google search simulation to better match organic click patterns." },
    ],
  },
  {
    version: "v0.8.0",
    date: "2026-01-30",
    items: [
      { type: "feature" as EntryType,     text: "Initial public launch. /run, /status, /jobs, /credits, /queue commands available." },
      { type: "bot" as EntryType,         text: "Redis-backed job queue with automatic retry and refund on failure." },
    ],
  },
];

export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-white">
      <MarketingHeader theme="light" />

      {/* Hero */}
      <section className="pt-28 pb-12 px-6 border-b border-zinc-100">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-[32px] font-bold tracking-tight text-zinc-900 mb-3">Changelog</h1>
          <p className="text-[15px] text-zinc-500 leading-relaxed">
            Updates, fixes, and improvements to the Graphref bot — newest first.
          </p>
        </div>
      </section>

      {/* Entries */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            {/* vertical line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-zinc-200" />

            <div className="space-y-12">
              {entries.map((entry, idx) => (
                <div key={entry.version} className="relative pl-8">
                  {/* dot — filled for latest, hollow for older */}
                  <div className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 ${
                    idx === 0
                      ? "bg-zinc-900 border-zinc-900"
                      : "bg-white border-zinc-300"
                  }`} />

                  {/* version + date */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[15px] font-bold text-zinc-900 font-mono">{entry.version}</span>
                    {idx === 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-900 text-white">Latest</span>
                    )}
                    <span className="text-[12px] text-zinc-400 ml-auto">{entry.date}</span>
                  </div>

                  {/* items */}
                  <div className="space-y-2.5">
                    {entry.items.map((item, i) => {
                      const cfg = typeConfig[item.type];
                      const Icon = cfg.Icon;
                      return (
                        <div key={i} className="flex items-start gap-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold shrink-0 mt-0.5 ${cfg.bg} ${cfg.color}`}>
                            <Icon size={10} />
                            {cfg.label}
                          </span>
                          <p className="text-[13px] text-zinc-600 leading-relaxed">{item.text}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom note */}
          <p className="mt-16 text-[12px] text-zinc-400 text-center">
            Older versions are not listed. Bot updates are applied automatically.
          </p>
        </div>
      </section>
    </main>
  );
}
