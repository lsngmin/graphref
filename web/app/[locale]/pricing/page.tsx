import { useTranslations } from "next-intl";
import { CheckCircle, MessageCircle } from "lucide-react";
import Header from "@/components/Header";
import PricingCards from "@/components/PricingCards";

export const metadata = {
  title: "Pricing — Graphref",
  description: "Simple, pay-as-you-go pricing. Credits never expire. No subscription.",
  openGraph: {
    title: "Pricing — Graphref",
    description: "Simple, pay-as-you-go pricing. Credits never expire. No subscription.",
    url: "https://graphref.com/pricing",
  },
};

const plans = [
  {
    key: "starter",
    name: "Starter",
    price: "$1.99",
    credits: 100,
    runs: 10,
    highlight: false,
    features: [
      "10 keyword runs",
      "Real organic-looking visits",
      "Visible in Search Console",
      "Credits never expire",
      "Auto-refund on failure",
    ],
  },
  {
    key: "basic",
    name: "Basic",
    price: "$8.99",
    credits: 500,
    runs: 50,
    highlight: true,
    features: [
      "50 keyword runs",
      "Real organic-looking visits",
      "Visible in Search Console",
      "Credits never expire",
      "Auto-refund on failure",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: "$15.99",
    credits: 1000,
    runs: 100,
    highlight: false,
    features: [
      "100 keyword runs",
      "Real organic-looking visits",
      "Visible in Search Console",
      "Credits never expire",
      "Auto-refund on failure",
      "Priority queue",
    ],
  },
];

const TELEGRAM_URL = "https://t.me/graphrefbot";

export default function PricingPage() {
  const t = useTranslations("home");

  return (
    <main className="min-h-screen bg-white text-zinc-900 font-sans">
      <Header pricingHref="/pricing" theme="light" />

      <section className="pt-32 md:pt-44 pb-20 md:pb-32 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-[40px] md:text-[56px] font-bold tracking-tight mb-4 leading-[1.1]">
            {t("pricing.title")}
          </h1>
          <p className="text-[17px] md:text-[19px] text-zinc-500 mb-14 max-w-2xl leading-relaxed">
            {t("pricing.sub")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <PricingCards plans={plans} />
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-4 text-[13px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle size={13} />
              {t("pricing.badgeNoSub")}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle size={13} />
              {t("pricing.badgeNoExpire")}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle size={13} />
              {t("pricing.badgeFree")}
            </span>
            <span className="flex items-center gap-1.5 ml-auto opacity-60">
              <svg viewBox="0 0 10 14" width="8" height="11" fill="none" aria-hidden="true">
                <rect x="1" y="5" width="8" height="8" rx="1.5" stroke="#71717a" strokeWidth="1.3"/>
                <path d="M3 5V3.5a2 2 0 0 1 4 0V5" stroke="#71717a" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <svg viewBox="0 0 56 14" width="42" height="11" aria-label="PayPal" role="img">
                <text y="12" fontFamily="Arial, Helvetica, sans-serif" fontWeight="bold" fontSize="13">
                  <tspan fill="#253B80">Pay</tspan>
                  <tspan fill="#179BD7">Pal</tspan>
                </text>
              </svg>
            </span>
          </div>
        </div>
      </section>

      {/* FAQ teaser */}
      <section className="py-16 px-6 bg-zinc-50">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-[16px] font-semibold text-zinc-900 mb-1">{t("faq.stillHaveQuestions")}</p>
            <p className="text-[14px] text-zinc-500">{t("faq.cantFind")}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/#faq"
              className="inline-flex items-center gap-2 border border-zinc-300 text-zinc-700 text-[13px] font-medium px-5 py-3 rounded-xl hover:border-zinc-400 hover:bg-zinc-100 transition-colors"
            >
              {t("faq.title")}
            </a>
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-zinc-900 text-white text-[13px] font-medium px-5 py-3 rounded-xl hover:bg-zinc-700 transition-colors"
            >
              <MessageCircle size={14} />
              {t("faq.contactUs")}
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span className="text-[13px] font-semibold tracking-tight">
            GRAPHREF
          </span>
          <div className="flex flex-wrap items-center gap-6 text-[12px] text-zinc-400">
            <a href="/contact" className="hover:text-zinc-600 transition-colors">
              {t("footer.contact")}
            </a>
            <a href="/terms" className="hover:text-zinc-600 transition-colors">
              {t("footer.terms")}
            </a>
            <a href="/privacy" className="hover:text-zinc-600 transition-colors">
              {t("footer.privacy")}
            </a>
            <span>© {new Date().getFullYear()} Graphref</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
