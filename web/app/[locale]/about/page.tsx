import { useTranslations } from "next-intl";
import Image from "next/image";
import Header from "@/components/Header";
import AnimationWrapper from "./AnimationWrapper";

export const metadata = {
  title: "About — Graphref",
  description: "The story behind Graphref — why we built a Telegram bot that drives real search visits.",
  openGraph: {
    title: "About — Graphref",
    description: "The story behind Graphref — why we built a Telegram bot that drives real search visits.",
    url: "https://graphref.com/about",
  },
};

// ── Frustration visual (Story 01) ────────────────────────────────
function FrustrationVisual() {
  const rows = [
    { label: "Month 1", text: "Content published", dot: "zinc" },
    { label: "Month 2", text: "Backlinks built",   dot: "zinc" },
    { label: "Month 3", text: "Still page 4",      dot: "red"  },
    { label: "Month 4", text: "First signal sent", dot: "emerald" },
  ];
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div
          key={r.label}
          className="flex items-center gap-4 px-6 py-4 rounded-2xl border border-zinc-100 bg-zinc-50"
        >
          <span className="font-mono text-[11px] text-zinc-400 w-16 shrink-0">{r.label}</span>
          <span className="text-sm text-zinc-600 flex-1">{r.text}</span>
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${
              r.dot === "emerald"
                ? "bg-emerald-400"
                : r.dot === "red"
                ? "bg-red-400"
                : "bg-zinc-300"
            }`}
          />
        </div>
      ))}
    </div>
  );
}

// ── Telegram mock (Story 02) ─────────────────────────────────────
function TelegramMock() {
  return (
    <div className="bg-[#17212b] rounded-2xl p-6 font-mono text-sm select-none">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 mb-4 border-b border-white/10">
        <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-300 font-sans font-bold">
          G
        </div>
        <div>
          <p className="text-white text-xs font-sans font-semibold leading-tight">@graphrefbot</p>
          <p className="text-zinc-500 text-[10px] font-sans">online</p>
        </div>
      </div>
      {/* Messages */}
      <div className="space-y-3">
        <div className="flex justify-end">
          <div className="bg-[#2b5278] text-white text-xs px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] leading-relaxed">
            /run graphref.com seo traffic tool
          </div>
        </div>
        <div className="flex justify-start">
          <div className="bg-[#232e3c] text-zinc-300 text-xs px-4 py-2.5 rounded-2xl rounded-tl-sm max-w-[85%] leading-relaxed space-y-1">
            <p className="text-emerald-400 font-semibold">✓ Campaign started</p>
            <p className="text-zinc-500">keyword: seo traffic tool</p>
            <p className="text-zinc-500">credits used: 10</p>
            <p className="text-zinc-500">check Search Console in ~2h</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export default function AboutPage() {
  const t = useTranslations();

  const timelineItems = [
    { year: "2023", title: t("about.timeline.2023title"), body: t("about.timeline.2023body"), current: false },
    { year: "2024", title: t("about.timeline.2024title"), body: t("about.timeline.2024body"), current: false },
    { year: "2025", title: t("about.timeline.2025title"), body: t("about.timeline.2025body"), current: false },
    { year: "2026", title: t("about.timeline.2026title"), body: t("about.timeline.2026body"), current: true  },
  ];

  const valueItems = [
    { title: t("about.values.items.0.title"), body: t("about.values.items.0.body"), wide: false },
    { title: t("about.values.items.1.title"), body: t("about.values.items.1.body"), wide: false },
    { title: t("about.values.items.2.title"), body: t("about.values.items.2.body"), wide: false },
    { title: t("about.values.items.3.title"), body: t("about.values.items.3.body"), wide: false },
    { title: t("about.values.items.4.title"), body: t("about.values.items.4.body"), wide: true  },
  ];

  return (
    <AnimationWrapper>
      <main className="bg-white text-zinc-900 min-h-screen font-sans">
        <Header activePage="about" theme="light" />

        {/* ── HERO (dark) ── */}
        <section className="relative overflow-hidden bg-[#18181b] min-h-[78vh] flex items-center px-8">
          <div aria-hidden className="pointer-events-none absolute left-6 top-16 md:left-8 md:top-18 lg:top-20">
            <Image
              src="/logo-mark-white.svg"
              alt=""
              width={900}
              height={900}
              className="h-auto w-[260px] md:w-[430px] lg:w-[620px] opacity-[0.1]"
            />
          </div>
          <div className="relative z-10 max-w-6xl mx-auto text-center">
            <h1 className="text-balance text-5xl md:text-7xl font-black tracking-tight text-white leading-[1.05]">
              Make search visibility accessible to people who ship
            </h1>
          </div>
        </section>

        {/* ── FOUNDER / TEAM (white, intro + cards) ── */}
        <section className="py-24 px-8 border-b border-zinc-100 about-section">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-16 items-start split-pair">
            <div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1] mb-6">
                {t("about.founder.title")}
              </h2>
              <p className="text-zinc-500 leading-relaxed mb-4">
                {t("about.founder.whyBuiltLine1")}
              </p>
              <p className="text-zinc-500 leading-relaxed">
                {t("about.founder.whyBuiltLine2")}
              </p>
            </div>

            <div className="grid gap-4 stagger-group">
              <article className="rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-6 stagger-item">
                <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-zinc-400 mb-3">
                  {t("about.founder.founder.label")}
                </p>
                <h3 className="text-xl font-bold text-zinc-900 leading-tight mb-1">
                  {t("about.founder.founder.name")}
                </h3>
                <p className="text-sm font-medium text-zinc-700 mb-3">
                  {t("about.founder.founder.role")}
                </p>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {t("about.founder.founder.bio")}
                </p>
              </article>

              <article className="rounded-2xl border border-zinc-200 bg-white px-6 py-6 stagger-item">
                <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-zinc-400 mb-3">
                  {t("about.founder.team.label")}
                </p>
                <h3 className="text-xl font-bold text-zinc-900 leading-tight mb-1">
                  {t("about.founder.team.name")}
                </h3>
                <p className="text-sm font-medium text-zinc-700 mb-3">
                  {t("about.founder.team.role")}
                </p>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {t("about.founder.team.bio")}
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ── STORY 01 (white, 2-col) ── */}
        <section className="py-32 px-8 border-b border-zinc-100 about-section">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20 items-center split-pair">
            <div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1] mb-8">
                {t("about.story.block1Title")}
              </h2>
              <p className="text-zinc-500 leading-relaxed mb-5">
                {t("about.story.block1p1")}
              </p>
              <p className="text-zinc-500 leading-relaxed">
                {t("about.story.block1p2")}
              </p>
            </div>
            <FrustrationVisual />
          </div>
        </section>

        {/* ── STORY 02 (white, 2-col reversed) ── */}
        <section className="py-32 px-8 border-b border-zinc-100 about-section">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20 items-center split-pair">
            <TelegramMock />
            <div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1] mb-8">
                {t("about.story.block2Title")}
              </h2>
              <p className="text-zinc-500 leading-relaxed mb-5">
                {t("about.story.block2p1")}
              </p>
              <p className="text-zinc-500 leading-relaxed">
                {t("about.story.block2p2")}
              </p>
            </div>
          </div>
        </section>

        {/* ── STATS (dark, full-bleed) ── */}
        <section className="bg-[#18181b] py-32 px-8">
          <div className="max-w-6xl mx-auto stats-block">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
              {[
                { value: "2.4M+", label: t("about.stats.clicks") },
                { value: "3,800+", label: t("about.stats.sites") },
                { value: "< 60s", label: t("about.stats.time") },
                { value: "2026", label: t("about.stats.founded") },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#18181b] px-10 py-12">
                  <p className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-[11px] text-zinc-500 font-mono tracking-widest uppercase">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TIMELINE (white, horizontal grid) ── */}
        <section className="py-32 px-8 border-b border-zinc-100 about-section">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-px bg-zinc-100 rounded-2xl overflow-hidden border border-zinc-100 stagger-group">
              {timelineItems.map((item) => (
                <div
                  key={item.year}
                  className={`px-8 py-10 stagger-item ${item.current ? "bg-zinc-900" : "bg-white"}`}
                >
                  <p className={`font-mono text-xs mb-6 ${item.current ? "text-zinc-500" : "text-zinc-400"}`}>
                    {item.year}
                  </p>
                  <h3 className={`font-bold text-sm mb-3 ${item.current ? "text-white" : "text-zinc-900"}`}>
                    {item.title}
                  </h3>
                  <p className={`text-xs leading-relaxed ${item.current ? "text-zinc-400" : "text-zinc-500"}`}>
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── VALUES (white, 2×2 card grid) ── */}
        <section className="py-32 px-8 border-b border-zinc-100 about-section">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-px bg-zinc-100 rounded-2xl overflow-hidden border border-zinc-100 stagger-group">
              {valueItems.map((item) => (
                <div key={item.title} className="bg-white px-10 py-10 stagger-item">
                  <h3 className="font-bold text-zinc-900 mb-3">{item.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SPONSOR (dark, 2-col) ── */}
        <section className="bg-[#18181b] py-32 px-8 about-section">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20 items-start split-pair">
            <div>
              <h2 className="text-4xl md:text-5xl font-black leading-[1.1] tracking-tight text-white">
                {t("about.sponsor.headline1")}
                <br />
                <span className="text-zinc-500">{t("about.sponsor.headline2")}</span>
              </h2>
            </div>
            <div>
              <p className="text-zinc-400 leading-relaxed text-sm mb-5">
                {t("about.sponsor.p1")}
              </p>
              <p className="text-zinc-400 leading-relaxed text-sm mb-10">
                {t("about.sponsor.p2")}
              </p>
              <a
                href="/contact"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white border border-white/20 px-6 py-3 rounded-full hover:bg-white/5 transition"
              >
                {t("about.sponsor.cta")}
              </a>
            </div>
          </div>
        </section>

        {/* ── CTA (white) ── */}
        <section className="py-40 px-8 about-section">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl md:text-7xl font-black tracking-tight text-zinc-900 mb-6">
              {t("about.cta.headline1")}
              <br />
              <span className="text-zinc-300">{t("about.cta.headline2")}</span>
            </h2>
            <p className="text-zinc-500 text-sm mb-12 max-w-sm mx-auto leading-relaxed">
              {t("about.cta.sub")}
            </p>
            <a
              href="https://t.me/graphrefbot"
              className="inline-flex items-center gap-2 px-10 py-5 bg-zinc-900 text-white text-sm font-bold rounded-full hover:bg-zinc-700 transition"
            >
              {t("about.cta.button")}
            </a>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-zinc-100 px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
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
    </AnimationWrapper>
  );
}
