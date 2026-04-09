import MarketingHeader from "@/components/MarketingHeader";

export default function AboutPage() {
  return (
    <main className="bg-white text-zinc-900 min-h-screen font-sans">
      <MarketingHeader activePage="about" theme="light" />

      {/* ── HERO ── */}
      <section className="pt-40 pb-24 px-8 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight text-zinc-900 mb-8">
          We got tired of
          <br />
          <span className="text-zinc-300">waiting for traffic.</span>
        </h1>
        <p className="text-lg text-zinc-500 leading-relaxed max-w-xl">
          So we built a tool that sends it instead. Graphref is a small team
          obsessed with one problem: making search visibility accessible to
          people who ship things.
        </p>
      </section>

      {/* ── DIVIDER ── */}
      <div className="border-t border-zinc-100 mx-8" />

      {/* ── STORY ── */}
      <section className="py-24 px-8 max-w-4xl mx-auto grid md:grid-cols-2 gap-16">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-5 leading-snug">
            Built out of frustration
          </h2>
          <p className="text-zinc-500 leading-relaxed text-sm">
            We ran sites. We wrote content. We built backlinks. Google still
            took months to notice. Meanwhile, big players with established
            authority kept ranking — not because their content was better, but
            because they had history.
          </p>
          <p className="text-zinc-500 leading-relaxed text-sm mt-4">
            We asked: what if we could simulate the signal Google actually
            cares about — real people searching, finding your site, clicking
            through?
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-5 leading-snug">
            A traffic engine, not an SEO tool
          </h2>
          <p className="text-zinc-500 leading-relaxed text-sm">
            Graphref doesn&apos;t touch your site. No plugins, no code, no access
            needed. You type a keyword and a domain. We drive organic-looking
            visits to your listing. You see it in Search Console within hours.
          </p>
          <p className="text-zinc-500 leading-relaxed text-sm mt-4">
            Simple because we wanted it to be usable. Telegram-first because
            nobody wants another dashboard.
          </p>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="border-t border-zinc-100 mx-8" />

      {/* ── STATS ── */}
      <section className="py-24 px-8 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-zinc-100 border border-zinc-100 rounded-2xl overflow-hidden">
          {[
            { value: "2.4M+", label: "Clicks delivered" },
            { value: "3,800+", label: "Sites powered" },
            { value: "< 60s", label: "Time to first run" },
            { value: "2026", label: "Founded" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white px-8 py-10">
              <p className="text-3xl font-black text-zinc-900 mb-2 tracking-tight">
                {stat.value}
              </p>
              <p className="text-xs text-zinc-400 font-mono tracking-wide">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="border-t border-zinc-100 mx-8" />

      {/* ── VALUES ── */}
      <section className="py-24 px-8 max-w-4xl mx-auto">
        <div className="space-y-px">
          {[
            {
              n: "01",
              title: "Simplicity is the feature.",
              body: "You shouldn't need a tutorial to send traffic to your site. One command. One result. That's the whole product.",
            },
            {
              n: "02",
              title: "Transparency over hype.",
              body: "We don't promise #1 rankings. We deliver real visit signals to Google — the same kind that naturally occur when people search for your keyword.",
            },
            {
              n: "03",
              title: "Built for builders.",
              body: "Indie hackers, solo founders, small agencies. People who ship fast and need results faster. Not enterprise sales cycles.",
            },
            {
              n: "04",
              title: "Credits, not subscriptions.",
              body: "Your money shouldn't evaporate every month. Credits don't expire. Use them when you need them.",
            },
          ].map((item) => (
            <div
              key={item.n}
              className="group flex gap-8 py-8 border-b border-zinc-100 hover:bg-zinc-50 transition px-4 -mx-4 rounded-lg cursor-default"
            >
              <span className="font-mono text-xs text-zinc-300 pt-1 shrink-0 w-6">
                {item.n}
              </span>
              <div>
                <h3 className="text-zinc-900 font-semibold mb-2">{item.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="border-t border-zinc-100 mx-8" />

      {/* ── SUPPORT ── */}
      <section className="py-24 px-8 max-w-4xl mx-auto grid md:grid-cols-2 gap-16">
        <div>
          <h2 className="text-4xl md:text-5xl font-black leading-[1.05] tracking-tight text-zinc-900">
            We&apos;re looking for
            <br />
            <span className="text-zinc-300">sponsors and supporters.</span>
          </h2>
        </div>
        <div>
          <p className="text-zinc-500 leading-relaxed text-sm">
            Graphref is still early. We&apos;re actively looking for sponsors,
            partners, and supporters who want to help fund the product and shape
            what we build next.
          </p>
          <p className="text-zinc-500 leading-relaxed text-sm mt-4">
            If you want to support the project, explore sponsorship, or talk
            about a partnership, reach out. We&apos;re open to the right fit.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 mt-8 text-sm font-semibold text-zinc-900 hover:text-zinc-500 transition"
          >
            Contact us about sponsorship →
          </a>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="border-t border-zinc-100 mx-8" />

      {/* ── CTA ── */}
      <section className="py-24 px-8 max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-black text-zinc-900 mb-4 tracking-tight">
          50 free credits.
          <br />
          <span className="text-zinc-300">No card required.</span>
        </h2>
        <p className="text-zinc-500 text-sm mb-10">
          Open the bot, type a command, see results in Search Console.
        </p>
        <a
          href="https://t.me/graphrefbot"
          className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-900 text-white text-sm font-bold rounded-full hover:bg-zinc-800 transition"
        >
          Open on Telegram →
        </a>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-zinc-100 px-8 py-8 flex items-center justify-between">
        <span className="font-mono text-xs tracking-[0.2em] text-zinc-400">
          GRAPHREF
        </span>
        <div className="flex gap-6 text-xs text-zinc-400">
          <a href="/contact" className="hover:text-zinc-600 transition">
            Contact
          </a>
          <a href="/terms" className="hover:text-zinc-600 transition">
            Terms
          </a>
          <a href="/privacy" className="hover:text-zinc-600 transition">
            Privacy
          </a>
          <span>© 2026 Graphref</span>
        </div>
      </footer>
    </main>
  );
}
