"use client";

import { useState } from "react";
import { MessageCircle, CheckCircle, ChevronDown, Search, Terminal, TrendingUp, Zap, Users, MousePointerClick } from "lucide-react";

const TELEGRAM_URL = "https://t.me/graphrefbot";
const CONTACT_EMAIL = "hello@graphref.org";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Open the bot on Telegram",
    desc: "No account setup. No forms. Just hit Start.",
  },
  {
    number: "02",
    icon: Terminal,
    title: "Type your keyword and domain",
    desc: "/run your keyword | yoursite.com",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Graphref does the rest",
    desc: "It drives real search visits to your site. You'll see it in Search Console.",
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

const testimonials = [
  {
    text: "Saw movement in Search Console within the first week. Simple and it just works.",
    name: "James R.",
    role: "Indie founder",
  },
  {
    text: "No subscription, no dashboard to learn. I type a command and it runs. That's all I needed.",
    name: "Sofia M.",
    role: "SEO consultant",
  },
  {
    text: "Tried a few tools before this. Graphref is the only one where I could actually see the visits in GSC.",
    name: "David K.",
    role: "E-commerce owner",
  },
];

const faqs = [
  {
    q: "Does this show up in Search Console?",
    a: "Yes. Each visit is driven through a real search query, so it registers as organic traffic in Google Search Console.",
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
  {
    q: "What happens if a job fails?",
    a: "Credits are automatically refunded if a job doesn't complete successfully.",
  },
];

const stats = [
  { icon: MousePointerClick, value: "2.4M+", label: "Clicks delivered" },
  { icon: Users, value: "3,800+", label: "Sites powered" },
  { icon: Zap, value: "< 60s", label: "Time to first run" },
];

// Sparkline chart path for the upward trend visual
const CHART_POINTS = [
  [0, 72], [12, 68], [24, 65], [36, 60], [48, 55], [60, 48], [72, 42],
  [84, 38], [96, 30], [108, 25], [120, 18], [132, 12], [144, 8], [156, 4], [168, 2],
];

function TrendChart() {
  const pts = CHART_POINTS.map(([x, y]) => `${x},${y}`).join(" ");
  const fillPts = `0,80 ${pts} 168,80`;
  return (
    <div className="relative w-full max-w-[220px]">
      <svg viewBox="0 0 168 80" className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#18181b" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#18181b" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={fillPts} fill="url(#chartGrad)" />
        <polyline
          points={pts}
          fill="none"
          stroke="#18181b"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dot at end */}
        <circle cx="168" cy="2" r="3.5" fill="#18181b" />
      </svg>
      <div className="absolute top-0 right-0 translate-x-2 -translate-y-1">
        <span className="text-[10px] font-semibold text-zinc-900 bg-white border border-zinc-200 rounded px-1.5 py-0.5 shadow-sm">
          ↑ CTR
        </span>
      </div>
    </div>
  );
}

function TelegramMockChat() {
  return (
    <div className="w-full max-w-[280px] bg-[#efeff4] rounded-2xl overflow-hidden shadow-xl border border-zinc-200/60">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center gap-3 border-b border-zinc-100">
        <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center shrink-0">
          <span className="text-white text-[10px] font-bold">G</span>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-zinc-900 leading-none">Graphref Bot</p>
          <p className="text-[11px] text-green-500 mt-0.5">online</p>
        </div>
      </div>
      {/* Messages */}
      <div className="px-3 py-4 space-y-2.5 text-[12px]">
        {/* User message */}
        <div className="flex justify-end">
          <div className="bg-[#4f81e0] text-white rounded-2xl rounded-tr-sm px-3 py-2 max-w-[80%] leading-snug">
            /run best coffee grinder | mycoffeeshop.com
          </div>
        </div>
        {/* Bot response 1 */}
        <div className="flex justify-start">
          <div className="bg-white text-zinc-800 rounded-2xl rounded-tl-sm px-3 py-2 max-w-[80%] leading-snug shadow-sm">
            ✅ Job started — 10 visits queued
          </div>
        </div>
        {/* Bot response 2 */}
        <div className="flex justify-start">
          <div className="bg-white text-zinc-800 rounded-2xl rounded-tl-sm px-3 py-2 max-w-[80%] leading-snug shadow-sm">
            📊 Done. Check Search Console in a few hours.
          </div>
        </div>
        {/* User message 2 */}
        <div className="flex justify-end">
          <div className="bg-[#4f81e0] text-white rounded-2xl rounded-tr-sm px-3 py-2 max-w-[80%] leading-snug">
            Wow, already seeing clicks 🚀
          </div>
        </div>
      </div>
    </div>
  );
}

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
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          {/* Left: text */}
          <div className="flex-1">
            <h1 className="text-[56px] leading-[1.08] font-bold tracking-tight text-zinc-900 mb-6">
              Stop waiting for traffic.
              <br />
              Send it yourself.
            </h1>
            <p className="text-[18px] text-zinc-500 leading-relaxed max-w-xl mb-10">
              Type a keyword. Pick your site. Graphref drives real search visits
              to your listing — so you don't have to wait months to move up.
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

          {/* Right: Telegram mock chat */}
          <div className="flex-shrink-0 flex flex-col items-center gap-6">
            <TelegramMockChat />
            {/* Mini chart below chat */}
            <div className="flex flex-col items-center gap-1">
              <TrendChart />
              <p className="text-[11px] text-zinc-400 tracking-wide uppercase">Search Console impressions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-zinc-100 py-10 px-6">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex flex-col items-center gap-2 text-center">
                <Icon size={20} className="text-zinc-400" />
                <span className="text-[28px] font-bold tracking-tight text-zinc-900">{s.value}</span>
                <span className="text-[13px] text-zinc-500">{s.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-zinc-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[28px] font-bold tracking-tight mb-14">
            How it works
          </h2>
          <div className="space-y-10">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="flex gap-6 items-start">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-white" />
                  </div>
                  <div className="pt-1">
                    <p className="text-[16px] font-semibold text-zinc-900 mb-1">
                      {step.title}
                    </p>
                    <p className="text-[14px] text-zinc-500">{step.desc}</p>
                  </div>
                </div>
              );
            })}
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
                  <p className="text-[13px] font-medium mb-3 text-zinc-400">
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
              <CheckCircle size={13} />
              No subscription
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle size={13} />
              Credits never expire
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle size={13} />
              50 free credits on signup
            </span>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-zinc-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[28px] font-bold tracking-tight mb-12">
            What people say
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-white border border-zinc-200 rounded-xl p-6 flex flex-col gap-4"
              >
                {/* Star rating */}
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="12" height="12" viewBox="0 0 12 12" fill="#18181b">
                      <path d="M6 1l1.3 2.6 2.9.4-2.1 2 .5 2.9L6 7.5 3.4 8.9l.5-2.9L1.8 4l2.9-.4z" />
                    </svg>
                  ))}
                </div>
                <p className="text-[14px] text-zinc-600 leading-relaxed">
                  "{t.text}"
                </p>
                <div className="mt-auto">
                  <p className="text-[13px] font-semibold text-zinc-900">
                    {t.name}
                  </p>
                  <p className="text-[12px] text-zinc-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6">
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
      <section className="py-24 px-6 bg-zinc-50">
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
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span className="text-[13px] font-semibold tracking-tight">
            GRAPHREF
          </span>
          <div className="flex flex-wrap items-center gap-6 text-[12px] text-zinc-400">
            <a href="/terms" className="hover:text-zinc-600 transition-colors">
              Terms of Service
            </a>
            <a
              href="/privacy"
              className="hover:text-zinc-600 transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="hover:text-zinc-600 transition-colors"
            >
              {CONTACT_EMAIL}
            </a>
            <span>© {new Date().getFullYear()} Graphref</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
