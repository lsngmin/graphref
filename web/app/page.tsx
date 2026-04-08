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

// GSC-style chart — 6 weeks of data, flat then sharp rise
const W = 560;
const H = 160;
const PAD = { top: 16, right: 20, bottom: 32, left: 44 };
const RAW = [8, 10, 9, 11, 13, 12, 14, 18, 24, 35, 52, 74, 98, 124];
const X_LABELS = ["Mar 3", "Mar 10", "Mar 17", "Mar 24", "Mar 31", "Apr 7", "Apr 14"];
const Y_TICKS = [0, 40, 80, 120];

function HeroTrendChart() {
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const maxVal = 140;

  const toX = (i: number) => PAD.left + (i / (RAW.length - 1)) * innerW;
  const toY = (v: number) => PAD.top + innerH - (v / maxVal) * innerH;

  const linePts = RAW.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
  const fillPts = `${toX(0)},${PAD.top + innerH} ${linePts} ${toX(RAW.length - 1)},${PAD.top + innerH}`;

  return (
    <div className="w-full bg-white border border-zinc-200 rounded-2xl px-5 pt-5 pb-4 shadow-sm">
      {/* Chart header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Google Search Console</p>
          <p className="text-[14px] font-semibold text-zinc-900">Impressions · last 6 weeks</p>
        </div>
        <span className="text-[12px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
          ↑ +1,450%
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="heroChartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#18181b" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#18181b" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {Y_TICKS.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left} y1={toY(tick)}
              x2={W - PAD.right} y2={toY(tick)}
              stroke="#e4e4e7" strokeWidth="1"
            />
            <text
              x={PAD.left - 8} y={toY(tick) + 4}
              textAnchor="end" fontSize="10" fill="#a1a1aa"
            >
              {tick}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {X_LABELS.map((label, i) => (
          <text
            key={label}
            x={toX(Math.round(i * (RAW.length - 1) / (X_LABELS.length - 1)))}
            y={H - 4}
            textAnchor="middle" fontSize="10" fill="#a1a1aa"
          >
            {label}
          </text>
        ))}

        {/* Fill area */}
        <polygon points={fillPts} fill="url(#heroChartGrad)" />

        {/* Line */}
        <polyline
          points={linePts}
          fill="none"
          stroke="#18181b"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* End dot */}
        <circle cx={toX(RAW.length - 1)} cy={toY(RAW[RAW.length - 1])} r="4" fill="#18181b" />
        <circle cx={toX(RAW.length - 1)} cy={toY(RAW[RAW.length - 1])} r="7" fill="#18181b" fillOpacity="0.12" />
      </svg>

      {/* Graphref ran label */}
      <div className="mt-2 flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-zinc-900" />
        <p className="text-[11px] text-zinc-400">Graphref first run: <span className="text-zinc-600 font-medium">Mar 24</span></p>
      </div>
    </div>
  );
}

function TelegramMockChat() {
  return (
    <div className="w-full max-w-[400px] bg-[#efeff4] rounded-2xl overflow-hidden shadow-xl border border-zinc-200/60">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center gap-3 border-b border-zinc-100">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center">
            <span className="text-white text-[12px] font-bold">G</span>
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-zinc-900 leading-none">Graphref Bot</p>
          <p className="text-[12px] text-green-500 mt-0.5">online</p>
        </div>
        <div className="flex items-center gap-3 text-zinc-300">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
        </div>
      </div>

      {/* Messages */}
      <div className="px-4 py-5 space-y-3 text-[13px]">
        {/* Date divider */}
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-zinc-200/70" />
          <span className="text-[10px] text-zinc-400 font-medium">Today</span>
          <div className="flex-1 h-px bg-zinc-200/70" />
        </div>

        {/* User message */}
        <div className="flex justify-end">
          <div className="flex flex-col items-end gap-1 max-w-[82%]">
            <div className="bg-[#4f81e0] text-white rounded-2xl rounded-tr-sm px-3.5 py-2.5 leading-snug">
              /run best coffee grinder | mycoffeeshop.com
            </div>
            <span className="text-[10px] text-zinc-400 pr-1">9:41 AM ✓✓</span>
          </div>
        </div>

        {/* Bot response 1 */}
        <div className="flex justify-start gap-2">
          <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 mt-auto mb-4">
            <span className="text-white text-[9px] font-bold">G</span>
          </div>
          <div className="flex flex-col gap-1 max-w-[82%]">
            <div className="bg-white text-zinc-800 rounded-2xl rounded-tl-sm px-3.5 py-2.5 leading-snug shadow-sm">
              ✅ Job started — 10 visits queued
            </div>
            <div className="bg-white text-zinc-800 rounded-2xl px-3.5 py-2.5 leading-snug shadow-sm">
              📊 Done. Check Search Console in a few hours.
            </div>
            <span className="text-[10px] text-zinc-400 pl-1">9:41 AM</span>
          </div>
        </div>

        {/* User message 2 */}
        <div className="flex justify-end">
          <div className="flex flex-col items-end gap-1 max-w-[82%]">
            <div className="bg-[#4f81e0] text-white rounded-2xl rounded-tr-sm px-3.5 py-2.5 leading-snug">
              Wow, already seeing clicks 🚀
            </div>
            <span className="text-[10px] text-zinc-400 pr-1">9:43 AM ✓✓</span>
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div className="bg-white px-3 py-2.5 flex items-center gap-2 border-t border-zinc-100">
        <div className="flex-1 bg-zinc-100 rounded-full px-4 py-2 text-[13px] text-zinc-400">
          Message
        </div>
        <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
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
      <section className="pt-40 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Top row: text + chat */}
          <div className="flex flex-col lg:flex-row items-center gap-14 mb-14">
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
            <div className="flex-shrink-0 w-full lg:w-auto flex justify-center">
              <TelegramMockChat />
            </div>
          </div>

          {/* Bottom: full-width GSC chart */}
          <HeroTrendChart />
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
