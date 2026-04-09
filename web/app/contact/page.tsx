import MarketingHeader from "@/components/MarketingHeader";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white font-sans text-zinc-900">
      <MarketingHeader pricingHref="/#pricing" theme="light" />

      {/* ── CONTENT ── */}
      <section className="pt-36 pb-24 px-8 max-w-2xl mx-auto">
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 mb-3">
          Contact
        </h1>
        <p className="text-zinc-500 text-sm leading-relaxed mb-12">
          Have a question or need help? We&apos;ll get back to you within 1–2
          business days.
        </p>

        {/* Cards */}
        <div className="space-y-px rounded-2xl overflow-hidden border border-zinc-200">
          {/* Email */}
          <a
            href="mailto:hello@graphref.org"
            className="group flex items-center justify-between bg-white px-6 py-5 transition hover:bg-zinc-50"
          >
            <div className="flex items-center gap-4">
              <div className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center group-hover:bg-zinc-200 transition shrink-0">
                <svg
                  className="w-3.5 h-3.5 text-zinc-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.75L2.25 6.75"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-0.5">Email</p>
                <p className="text-zinc-900 text-sm font-medium">
                  hello@graphref.org
                </p>
              </div>
            </div>
            <span className="text-zinc-400 group-hover:text-zinc-700 transition text-xs font-mono">
              →
            </span>
          </a>

          {/* Telegram */}
          <a
            href="https://t.me/graphrefbot"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between bg-white px-6 py-5 transition hover:bg-zinc-50"
          >
            <div className="flex items-center gap-4">
              <div className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center group-hover:bg-zinc-200 transition shrink-0">
                <svg
                  className="w-3.5 h-3.5 text-zinc-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-0.5">Telegram</p>
                <p className="text-zinc-900 text-sm font-medium">@graphrefbot</p>
              </div>
            </div>
            <span className="text-zinc-400 group-hover:text-zinc-700 transition text-xs font-mono">
              →
            </span>
          </a>

          {/* Response time */}
          <div className="flex items-center bg-white px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center shrink-0">
                <svg
                  className="w-3.5 h-3.5 text-zinc-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-0.5">Response time</p>
                <p className="text-zinc-900 text-sm font-medium">
                  1–2 business days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ hint */}
        <div className="mt-8 flex items-center justify-between py-5 border-t border-zinc-100">
          <p className="text-zinc-400 text-sm">Most answers are in the FAQ.</p>
          <a
            href="/#faq"
            className="text-xs text-zinc-400 hover:text-zinc-700 transition font-mono"
          >
            View FAQ →
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-zinc-100 px-8 py-8 flex items-center justify-between">
        <span className="font-mono text-xs tracking-[0.2em] text-zinc-400">
          GRAPHREF
        </span>
        <div className="flex gap-6 text-xs text-zinc-400">
          <a href="/contact" className="text-zinc-600">
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
