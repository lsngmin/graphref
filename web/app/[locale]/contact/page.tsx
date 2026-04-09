import { useTranslations } from "next-intl";
import MarketingHeader from "@/components/MarketingHeader";

export default function ContactPage() {
  const t = useTranslations();

  return (
    <main className="min-h-screen bg-white font-sans text-zinc-900">
      <MarketingHeader pricingHref="/#pricing" theme="light" />

      {/* ── CONTENT ── */}
      <section className="pt-36 pb-24 px-8 max-w-2xl mx-auto">
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 mb-3">
          {t("contact.title")}
        </h1>
        <p className="text-zinc-500 text-sm leading-relaxed mb-12">
          {t("contact.sub")}
        </p>

        {/* Cards */}
        <div className="space-y-px rounded-2xl overflow-hidden border border-zinc-200">
          {/* Email */}
          <a
            href="mailto:support@graphref.org"
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
                <p className="text-xs text-zinc-400 mb-0.5">{t("contact.emailLabel")}</p>
                <p className="text-zinc-900 text-sm font-medium">
                  support@graphref.org
                </p>
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
                <p className="text-xs text-zinc-400 mb-0.5">{t("contact.responseLabel")}</p>
                <p className="text-zinc-900 text-sm font-medium">
                  {t("contact.responseValue")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ hint */}
        <div className="mt-8 flex items-center justify-between py-5 border-t border-zinc-100">
          <p className="text-zinc-400 text-sm">{t("contact.faqHint")}</p>
          <a
            href="/#faq"
            className="text-xs text-zinc-400 hover:text-zinc-700 transition font-mono"
          >
            {t("contact.viewFaq")}
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
            {t("contact.footer.contact")}
          </a>
          <a href="/terms" className="hover:text-zinc-600 transition">
            {t("contact.footer.terms")}
          </a>
          <a href="/privacy" className="hover:text-zinc-600 transition">
            {t("contact.footer.privacy")}
          </a>
          <span>© 2026 Graphref</span>
        </div>
      </footer>
    </main>
  );
}
