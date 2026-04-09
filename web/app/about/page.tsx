export default function About() {
  return (
    <main className="min-h-screen bg-white px-6 py-24">
      <div className="max-w-2xl mx-auto">
        <a
          href="/"
          className="text-[13px] text-zinc-400 hover:text-zinc-700 transition-colors mb-12 inline-block"
        >
          ← Back
        </a>
        <h1 className="text-[36px] font-bold tracking-tight mb-3">About</h1>
        <p className="text-[18px] text-zinc-500 leading-relaxed mb-16">
          Graphref is a search traffic tool built for people who want results
          without waiting.
        </p>

        <div className="space-y-12">
          <section>
            <h2 className="text-[16px] font-semibold text-zinc-900 mb-3">
              Why we built this
            </h2>
            <p className="text-[15px] text-zinc-500 leading-relaxed">
              SEO takes time. Most tools ask you to set up dashboards, manage
              campaigns, and wait months to see any movement. We wanted
              something simpler — type a keyword, point it at your site, and
              watch the visits show up in Search Console. That's Graphref.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-zinc-900 mb-3">
              How it works
            </h2>
            <p className="text-[15px] text-zinc-500 leading-relaxed">
              Graphref runs entirely through Telegram. There's no account to
              create, no dashboard to learn. You send a command with your
              keyword and domain, and Graphref handles the rest — driving real
              search visits to your listing that register in Google Search
              Console.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-zinc-900 mb-3">
              Pricing model
            </h2>
            <p className="text-[15px] text-zinc-500 leading-relaxed">
              We charge per use, not per month. You buy credits once and spend
              them whenever you want. No subscriptions, no commitments. Credits
              never expire.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-zinc-900 mb-3">
              Get in touch
            </h2>
            <p className="text-[15px] text-zinc-500 leading-relaxed">
              Questions or feedback? We're reachable at{" "}
              <a
                href="mailto:hello@graphref.org"
                className="text-zinc-900 underline"
              >
                hello@graphref.org
              </a>{" "}
              or through the{" "}
              <a
                href="https://t.me/graphrefbot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-900 underline"
              >
                Telegram bot
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
