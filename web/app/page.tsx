"use client";

import { useState } from "react";
import { MessageCircle, CheckCircle, ChevronDown } from "lucide-react";

const TELEGRAM_URL = "https://t.me/graphrefbot";

const steps = [
  {
    number: "01",
    title: "Open the bot on Telegram",
    desc: "No account setup. No forms. Just hit Start.",
  },
  {
    number: "02",
    title: "Type your keyword and domain",
    desc: "/run your keyword | yoursite.com",
  },
  {
    number: "03",
    title: "Graphref does the rest",
    desc: "It searches Google and clicks your listing. You'll see it in Search Console.",
  },
];

const plans = [
  {
    key: "starter",
    name: "Starter",
    price: "$1.99",
    credits: 100,
    desc: "Try it out. 100 clicks, no expiry.",
    highlight: false,
  },
  {
    key: "basic",
    name: "Basic",
    price: "$8.99",
    credits: 500,
    desc: "For sites you're serious about.",
    highlight: true,
  },
  {
    key: "pro",
    name: "Pro",
    price: "$15.99",
    credits: 1000,
    desc: "For when you're ready to push.",
    highlight: false,
  },
];

const faqs = [
  {
    q: "Does this show up in Search Console?",
    a: "Yes. Each click is a real search query routed through Google, so it registers as organic traffic in Search Console.",
  },
  {
    q: "Do credits expire?",
    a: "No. Buy once, use whenever.",
  },
  {
    q: "How do I get started?",
    a: "Open Telegram and type /start. New users get 50 free credits — enough for 5 runs.",
  },
  {
    q: "Can I cancel anytime?",
    a: "There's nothing to cancel. Credits are one-time purchases, not subscriptions.",
  },
];

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border-b border-zinc-200 py-5 cursor-pointer select-none"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-[15px] font-medium text-zinc-900">{q}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </div>
      {open && (
        <p className="mt-3 text-[14px] text-zinc-500 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-zinc-900 font-sans">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur border-b border-zinc-100">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight">GRAPHREF</span>
          <a
            href="#pricing"
            className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            Pricing
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-28 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-[56px] leading-[1.08] font-bold tracking-tight text-zinc-900 mb-6">
            Stop waiting for traffic.
            <br />
            Send it yourself.
          </h1>
          <p className="text-[18px] text-zinc-500 leading-relaxed max-w-xl mb-10">
            Type a keyword. Pick your site. Graphref searches Google and clicks
            your listing — so you don't have to wait months to move up.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-zinc-900 text-white text-sm font-medium px-5 py-3 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              <MessageCircle size={16} />
              Open on Telegram
            </a>
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 text-sm text-zinc-500 px-5 py-3 rounded-lg border border-zinc-200 hover:border-zinc-400 transition-colors"
            >
              View pricing
            </a>
          </div>
          <p className="mt-5 text-[13px] text-zinc-400">
            New users get 50 free credits — no card required.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-zinc-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[28px] font-bold tracking-tight mb-14">
            How it works
          </h2>
          <div className="space-y-10">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-8 items-start">
                <span className="text-[13px] font-mono text-zinc-300 pt-1 w-8 shrink-0">
                  {step.number}
                </span>
                <div>
                  <p className="text-[16px] font-semibold text-zinc-900 mb-1">
                    {step.title}
                  </p>
                  <p className="text-[14px] text-zinc-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[28px] font-bold tracking-tight mb-3">
            Pricing
          </h2>
          <p className="text-[15px] text-zinc-500 mb-12">
            Credits never expire. No subscription.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.key}
                className={`rounded-xl border p-6 flex flex-col gap-4 ${
                  plan.highlight
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-900"
                }`}
              >
                <div>
                  <p
                    className={`text-[13px] font-medium mb-3 ${plan.highlight ? "text-zinc-400" : "text-zinc-400"}`}
                  >
                    {plan.name}
                  </p>
                  <p className="text-[32px] font-bold tracking-tight leading-none mb-1">
                    {plan.price}
                  </p>
                  <p
                    className={`text-[13px] mt-2 ${plan.highlight ? "text-zinc-400" : "text-zinc-500"}`}
                  >
                    {plan.credits.toLocaleString()} credits
                  </p>
                </div>
                <p
                  className={`text-[13px] leading-relaxed ${plan.highlight ? "text-zinc-400" : "text-zinc-500"}`}
                >
                  {plan.desc}
                </p>
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-auto inline-flex items-center justify-center gap-2 text-[13px] font-medium px-4 py-2.5 rounded-lg transition-colors ${
                    plan.highlight
                      ? "bg-white text-zinc-900 hover:bg-zinc-100"
                      : "bg-zinc-900 text-white hover:bg-zinc-700"
                  }`}
                >
                  <MessageCircle size={14} />
                  Get started
                </a>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-4 text-[13px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle size={13} className="text-zinc-400" />
              No subscription
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle size={13} className="text-zinc-400" />
              Credits never expire
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle size={13} className="text-zinc-400" />
              50 free credits on signup
            </span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 bg-zinc-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[28px] font-bold tracking-tight mb-10">FAQ</h2>
          <div>
            {faqs.map((faq) => (
              <FAQ key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[36px] font-bold tracking-tight mb-4">
            Ready to try it?
          </h2>
          <p className="text-[16px] text-zinc-500 mb-8">
            Open the bot and run your first job in under a minute.
          </p>
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-zinc-900 text-white text-sm font-medium px-5 py-3 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            <MessageCircle size={16} />
            Open on Telegram
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-[13px] font-semibold tracking-tight">
            GRAPHREF
          </span>
          <span className="text-[12px] text-zinc-400">
            © {new Date().getFullYear()} Graphref
          </span>
        </div>
      </footer>
    </main>
  );
}
