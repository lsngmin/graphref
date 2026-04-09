import { useTranslations } from "next-intl";
import MarketingHeader from "@/components/MarketingHeader";

// ── Brand hex mark (background decoration) ───────────────────────
function BgHex({ size = 480 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <polygon
        points="14,2 24,8 24,20 14,26 4,20 4,8"
        stroke="white" strokeWidth="1.5" strokeLinejoin="round"
      />
      <line x1="14" y1="14" x2="14" y2="2"  stroke="white" strokeWidth="1" strokeLinecap="round"/>
      <line x1="14" y1="14" x2="24" y2="20" stroke="white" strokeWidth="1" strokeLinecap="round"/>
      <line x1="14" y1="14" x2="4"  y2="20" stroke="white" strokeWidth="1" strokeLinecap="round"/>
      <circle cx="14" cy="2"  r="2" fill="white"/>
      <circle cx="24" cy="20" r="2" fill="white"/>
      <circle cx="4"  cy="20" r="2" fill="white"/>
      <circle cx="14" cy="14" r="3" fill="white"/>
    </svg>
  );
}

// ── Story Timeline ───────────────────────────────────────────────
function StoryTimeline({ t }: { t: ReturnType<typeof useTranslations> }) {
  const items = [
    {
      year: "2023",
      title: t("about.timeline.2023title"),
      body: t("about.timeline.2023body"),
    },
    {
      year: "2024",
      title: t("about.timeline.2024title"),
      body: t("about.timeline.2024body"),
    },
    {
      year: "2025",
      title: t("about.timeline.2025title"),
      body: t("about.timeline.2025body"),
    },
    {
      year: "2026",
      title: t("about.timeline.2026title"),
      body: t("about.timeline.2026body"),
      current: true,
    },
  ];

  return (
    <div className="relative">
      {/* Vertical connecting line */}
      <div className="absolute left-[19px] top-5 bottom-5 w-px bg-zinc-200" />

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div key={item.year} className="relative flex gap-5 items-start">
            {/* Node */}
            <div
              className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                item.current
                  ? "bg-zinc-900 text-white"
                  : "bg-white border border-zinc-200 text-zinc-400"
              }`}
            >
              {item.year.slice(2)}
            </div>

            {/* Card */}
            <div
              className={`flex-1 rounded-xl px-5 py-4 mb-1 ${
                item.current
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-50 border border-zinc-100"
              }`}
            >
              <p className={`text-[10px] font-mono mb-1 ${item.current ? "text-zinc-500" : "text-zinc-400"}`}>
                {item.year}
              </p>
              <h3 className={`text-sm font-semibold mb-1 ${item.current ? "text-white" : "text-zinc-900"}`}>
                {item.title}
              </h3>
              <p className={`text-xs leading-relaxed ${item.current ? "text-zinc-400" : "text-zinc-500"}`}>
                {item.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export default function AboutPage() {
  const t = useTranslations();

  return (
    <main className="bg-white text-zinc-900 min-h-screen font-sans">
      <MarketingHeader activePage="about" theme="light" />

      {/* ── HERO (dark) ── */}
      <section className="relative bg-[#18181b] overflow-hidden">
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Large hex mark */}
        <div className="absolute top-1/2 -translate-y-1/2 right-[-60px] opacity-[0.06] pointer-events-none select-none">
          <BgHex size={580} />
        </div>

        <div className="relative z-10 pt-44 pb-32 px-8 max-w-4xl mx-auto">
          <p className="font-mono text-xs tracking-[0.2em] text-zinc-600 mb-8">
            {t("about.hero.eyebrow")}
          </p>
          <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight text-white mb-8">
            {t("about.hero.headline1")}
            <br />
            <span className="text-zinc-600">{t("about.hero.headline2")}</span>
          </h1>
          <p className="text-zinc-400 leading-relaxed max-w-xl text-lg">
            {t("about.hero.sub")}
          </p>
        </div>
      </section>

      {/* ── STORY ── */}
      <section className="py-24 px-8 max-w-4xl mx-auto">
        {[
          {
            n: "01",
            title: t("about.story.block1Title"),
            paragraphs: [
              t("about.story.block1p1"),
              t("about.story.block1p2"),
            ],
          },
          {
            n: "02",
            title: t("about.story.block2Title"),
            paragraphs: [
              t("about.story.block2p1"),
              t("about.story.block2p2"),
            ],
          },
        ].map((block, i) => (
          <div
            key={block.n}
            className={`relative overflow-hidden py-14 ${i > 0 ? "border-t border-zinc-100" : ""}`}
          >
            {/* Watermark number */}
            <span className="absolute right-0 top-1/2 -translate-y-1/2 font-mono font-black leading-none select-none pointer-events-none text-[140px] text-zinc-900/[0.04]">
              {block.n}
            </span>

            {/* Node dot + title */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-5 h-5 rounded-full border border-zinc-300 flex items-center justify-center shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 leading-snug">
                {block.title}
              </h2>
            </div>

            <div className="pl-8">
              {block.paragraphs.map((p, j) => (
                <p
                  key={j}
                  className={`text-zinc-500 leading-relaxed text-sm ${j > 0 ? "mt-4" : ""}`}
                >
                  {p}
                </p>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ── STATS (dark, full-bleed) ── */}
      <section className="relative bg-[#18181b] overflow-hidden py-24">
        <div className="absolute top-1/2 -translate-y-1/2 right-[-40px] opacity-[0.05] pointer-events-none select-none">
          <BgHex size={380} />
        </div>
        <div className="relative z-10 px-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
            {[
              { value: "2.4M+", label: t("about.stats.clicks") },
              { value: "3,800+", label: t("about.stats.sites") },
              { value: "< 60s", label: t("about.stats.time") },
              { value: "2026", label: t("about.stats.founded") },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#18181b] px-8 py-10">
                <p className="text-3xl font-black text-white mb-2 tracking-tight">
                  {stat.value}
                </p>
                <p className="text-xs text-zinc-500 font-mono tracking-wide">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section className="py-24 px-8 max-w-4xl mx-auto">
        <p className="font-mono text-xs tracking-[0.2em] text-zinc-400 mb-12">{t("about.timeline.eyebrow")}</p>
        <StoryTimeline t={t} />
      </section>

      <div className="border-t border-zinc-100 mx-8" />

      {/* ── VALUES (node-line graph connections) ── */}
      <section className="py-24 px-8 max-w-4xl mx-auto">
        <p className="font-mono text-xs tracking-[0.2em] text-zinc-400 mb-12">{t("about.values.eyebrow")}</p>
        <div className="relative">
          {/* Vertical connecting line */}
          <div className="absolute left-[11px] top-4 bottom-4 w-px bg-zinc-200" />

          {[
            {
              title: t("about.values.items.0.title"),
              body: t("about.values.items.0.body"),
            },
            {
              title: t("about.values.items.1.title"),
              body: t("about.values.items.1.body"),
            },
            {
              title: t("about.values.items.2.title"),
              body: t("about.values.items.2.body"),
            },
            {
              title: t("about.values.items.3.title"),
              body: t("about.values.items.3.body"),
            },
          ].map((item, i, arr) => (
            <div
              key={item.title}
              className={`relative flex gap-8 py-8 ${i < arr.length - 1 ? "border-b border-zinc-100" : ""}`}
            >
              {/* Node dot */}
              <div className="relative z-10 w-6 h-6 rounded-full border border-zinc-200 bg-white flex items-center justify-center shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-zinc-400" />
              </div>
              <div>
                <h3 className="text-zinc-900 font-semibold mb-2">{item.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SUPPORT (dark, full-bleed) ── */}
      <section className="relative bg-[#18181b] overflow-hidden py-24 px-8">
        <div className="absolute bottom-[-40px] left-[-40px] opacity-[0.04] pointer-events-none select-none">
          <BgHex size={280} />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-black leading-[1.05] tracking-tight text-white">
              {t("about.sponsor.headline1")}
              <br />
              <span className="text-zinc-600">{t("about.sponsor.headline2")}</span>
            </h2>
          </div>
          <div>
            <p className="text-zinc-400 leading-relaxed text-sm">
              {t("about.sponsor.p1")}
            </p>
            <p className="text-zinc-400 leading-relaxed text-sm mt-4">
              {t("about.sponsor.p2")}
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 mt-8 text-sm font-semibold text-white hover:text-zinc-400 transition"
            >
              {t("about.sponsor.cta")}
            </a>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 px-8 max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-black text-zinc-900 mb-4 tracking-tight">
          {t("about.cta.headline1")}
          <br />
          <span className="text-zinc-300">{t("about.cta.headline2")}</span>
        </h2>
        <p className="text-zinc-500 text-sm mb-10">
          {t("about.cta.sub")}
        </p>
        <a
          href="https://t.me/graphrefbot"
          className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-900 text-white text-sm font-bold rounded-full hover:bg-zinc-800 transition"
        >
          {t("about.cta.button")}
        </a>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-zinc-100 px-8 py-8 flex items-center justify-between">
        <span className="font-mono text-xs tracking-[0.2em] text-zinc-400 flex items-center">
          <span style={{ opacity: 0.5 }}>GRAP</span>
          <span
            className="inline-block w-[3px] h-[3px] rounded-full mx-[4px]"
            style={{ background: "currentColor", opacity: 0.5 }}
          />
          <span className="font-bold">HREF</span>
        </span>
        <div className="flex gap-6 text-xs text-zinc-400">
          <a href="/contact" className="hover:text-zinc-600 transition">{t("about.footer.contact")}</a>
          <a href="/terms" className="hover:text-zinc-600 transition">{t("about.footer.terms")}</a>
          <a href="/privacy" className="hover:text-zinc-600 transition">{t("about.footer.privacy")}</a>
          <span>© 2026 Graphref</span>
        </div>
      </footer>
    </main>
  );
}
