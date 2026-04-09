"use client";

import { useState } from "react";
import { MessageCircle, CheckCircle, ChevronDown, Search, Terminal, TrendingUp, Zap, Users, MousePointerClick } from "lucide-react";
import MarketingHeader from "@/components/MarketingHeader";

const TELEGRAM_URL = "https://t.me/graphrefbot";
const CONTACT_EMAIL = "support@graphref.org";

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

const testimonials = [
  {
    text: "I've tried paid backlinks, guest posts, all of it. Nothing moved the needle as fast as Graphref. Within the first week I could see real movement in Search Console — impressions up, clicks coming in. It's stupidly simple. You type a command and it just works.",
    name: "James R.",
    role: "Indie founder",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    metric: "+1,200% impressions",
    metricSub: "in 7 days",
    date: "March 22, 2026",
  },
  {
    text: "No subscription, no dashboard to learn. I type a command and it runs. That's all I needed.",
    name: "Sofia M.",
    role: "SEO consultant",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    metric: "Ranked #3",
    metricSub: "",
    date: "January 14, 2026",
  },
  {
    text: "Tried a few tools before this. Graphref is the only one where I could actually see the visits in GSC.",
    name: "David K.",
    role: "E-commerce owner",
    avatar: "https://randomuser.me/api/portraits/men/76.jpg",
    metric: "+340% CTR",
    metricSub: "",
    date: "February 7, 2026",
  },
];

const faqs = [
  {
    q: "How does Graphref actually work?",
    a: "Graphref uses a network of real devices to perform genuine Google searches for your target keyword, then clicks through to your site from the search results. This simulates organic search behavior — the kind of engagement signal that Google uses to evaluate how relevant your page is to a given query. Because every visit originates from an actual search, it shows up as organic traffic in Google Search Console.",
  },
  {
    q: "Will I see results in Google Search Console?",
    a: "Yes. Since visits are driven through real search queries, they register as organic impressions and clicks in GSC. Most users start seeing movement within 24–72 hours of their first run. We recommend monitoring your target keyword's impression and click data in the Performance tab.",
  },
  {
    q: "Is it safe? Will Google penalize my site?",
    a: "Graphref is designed to mimic natural user behavior as closely as possible — real devices, real searches, realistic session patterns. We don't use bots or headless browsers. That said, no third-party traffic tool can guarantee zero risk, and we encourage you to use it as one part of a broader SEO strategy rather than a sole growth channel.",
  },
  {
    q: "How many visits does one credit give me?",
    a: "One run costs 10 credits and delivers 10 targeted search visits to your site. You choose the keyword and domain each time you run a job. There's no minimum spend — you can run a single job with your free credits to see how it works before purchasing more.",
  },
  {
    q: "Can I target multiple keywords or domains?",
    a: "Yes. Each /run command accepts one keyword and one domain, but you can run as many jobs as your credits allow — across different keywords, different pages, or entirely different sites. There's no restriction on how many domains you use.",
  },
  {
    q: "Do credits expire?",
    a: "Never. Credits you purchase are yours indefinitely. There's no monthly renewal, no expiry date, and no pressure to use them by a certain time. Buy when you need them, use them at your own pace.",
  },
  {
    q: "What if a job doesn't complete successfully?",
    a: "If a job fails for any reason — network issues, invalid domain, or a processing error on our end — your credits are automatically refunded in full. You'll receive a notification in the Telegram bot with the reason and your restored balance.",
  },
  {
    q: "Is there a subscription or recurring charge?",
    a: "No. Graphref is entirely credit-based. You pay once for a credit package and use them whenever you want. There's no subscription to manage, no auto-renewal to worry about, and nothing to cancel.",
  },
];

const stats = [
  { icon: MousePointerClick, value: "2.4M+", label: "Clicks delivered" },
  { icon: Users, value: "3,800+", label: "Sites powered" },
  { icon: Zap, value: "< 60s", label: "Time to first run" },
];

// Background chart — full-bleed behind hero content
const BG_RAW = [10, 14, 22, 40, 68, 98, 124, 138, 142, 140, 138, 136, 135, 134, 133];

function HeroBgChart() {
  const W = 1000;
  const H = 500;
  const padL = 70;
  const padR = 40;
  const padTop = 110;
  const padBot = 40;
  const maxVal = 150;

  const innerW = W - padL - padR;
  const innerH = H - padTop - padBot;

  const toX = (i: number) => padL + (i / (BG_RAW.length - 1)) * innerW;
  const toY = (v: number) => padTop + innerH - (v / maxVal) * innerH;

  const linePts = BG_RAW.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
  const fillPts = `${toX(0)},${padTop + innerH} ${linePts} ${toX(BG_RAW.length - 1)},${padTop + innerH}`;

  // Y grid ticks
  const yTicks = [0, 50, 100, 150];
  // X date labels
  const xLabels = ["Mar 3", "Mar 17", "Mar 31", "Apr 14"];

  const endX = toX(BG_RAW.length - 1);
  const endY = toY(BG_RAW[BG_RAW.length - 1]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bgChartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4d4d8" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#d4d4d8" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y grid lines + labels */}
      {yTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={padL} y1={toY(tick)}
            x2={W - padR} y2={toY(tick)}
            stroke="#e4e4e7" strokeWidth="1"
          />
          <text x={padL - 8} y={toY(tick) + 4} textAnchor="end" fontSize="11" fill="#a1a1aa">
            {tick}
          </text>
        </g>
      ))}

      {/* X labels */}
      {xLabels.map((label, i) => (
        <text
          key={label}
          x={toX(Math.round(i * (BG_RAW.length - 1) / (xLabels.length - 1)))}
          y={padTop + innerH + 20}
          textAnchor="middle" fontSize="11" fill="#a1a1aa"
        >
          {label}
        </text>
      ))}

      {/* Fill */}
      <polygon points={fillPts} fill="url(#bgChartFill)" />

      {/* Line */}
      <polyline
        points={linePts}
        fill="none"
        stroke="#c4c4c8"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* End dot + pulse */}
      <circle cx={endX} cy={endY} r="8" fill="#a1a1aa" fillOpacity="0.15" />
      <circle cx={endX} cy={endY} r="4" fill="#71717a" />

    </svg>
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

const rankingRows = [
  { keyword: "best coffee grinder", before: 14, after: 3 },
  { keyword: "pour over coffee maker", before: 21, after: 7 },
  { keyword: "espresso machine home", before: 18, after: 5 },
];

function ChatTypeCard() {
  return (
    <div className="bg-[#efeff4] rounded-2xl overflow-hidden border border-zinc-200/60 shadow-sm">
      <div className="bg-white px-3 py-2.5 flex items-center gap-2 border-b border-zinc-100">
        <div className="relative shrink-0">
          <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center">
            <span className="text-white text-[9px] font-bold">G</span>
          </div>
          <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-green-400 rounded-full border border-white" />
        </div>
        <p className="text-[12px] font-semibold text-zinc-900">Graphref Bot</p>
      </div>
      {/* Sent message bubble */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex justify-end">
          <div className="bg-[#4f81e0] text-white rounded-2xl rounded-tr-sm px-3 py-2 text-[12px] leading-snug max-w-[88%]">
            /run best coffee grinder | mycoffeeshop.com
          </div>
        </div>
      </div>
      {/* Input bar — typing effect */}
      <div className="bg-white px-3 py-2 flex items-center gap-2 border-t border-zinc-100">
        <div className="flex-1 bg-zinc-100 rounded-full px-3 py-1.5 flex items-center text-[12px] text-zinc-700">
          /run keyword | yoursite.com
          <span className="inline-block w-0.5 h-3.5 bg-zinc-500 rounded-full animate-pulse ml-0.5" />
        </div>
        <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center shrink-0">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
        </div>
      </div>
    </div>
  );
}

function RankingCard() {
  return (
    <div className="w-full max-w-[340px] bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[12px] font-semibold text-zinc-700">Search Console · Performance</span>
        </div>
        <span className="text-[11px] text-zinc-400">Last 28 days</span>
      </div>
      {/* Column headers */}
      <div className="grid grid-cols-[1fr_56px_56px] px-4 py-2 bg-zinc-50 border-b border-zinc-100">
        <span className="text-[11px] text-zinc-400 font-medium">Keyword</span>
        <span className="text-[11px] text-zinc-400 font-medium text-center">Before</span>
        <span className="text-[11px] text-zinc-400 font-medium text-center">After</span>
      </div>
      {/* Rows */}
      {rankingRows.map((row) => (
        <div key={row.keyword} className="grid grid-cols-[1fr_56px_56px] px-4 py-3 border-b border-zinc-50 last:border-0 items-center">
          <span className="text-[12px] text-zinc-700 truncate pr-2">{row.keyword}</span>
          <span className="text-[13px] text-zinc-400 font-medium text-center">#{row.before}</span>
          <div className="flex items-center justify-center gap-1">
            <span className="text-[13px] font-bold text-emerald-600">#{row.after}</span>
            <span className="text-[10px] text-emerald-500">↑</span>
          </div>
        </div>
      ))}
      {/* Footer */}
      <div className="px-4 py-2.5 bg-zinc-50 flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span className="text-[11px] text-zinc-400">Powered by Graphref</span>
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
      <MarketingHeader pricingHref="#pricing" theme="light" />

      {/* Hero */}
      <section className="relative pt-24 md:pt-52 pb-16 md:pb-28 px-6 overflow-hidden">
        {/* Background chart — desktop only */}
        <div className="hidden md:block absolute inset-0">
          <HeroBgChart />
        </div>
        {/* Mobile background */}
        <div className="md:hidden absolute inset-0 bg-zinc-50" />
        {/* Callout badge — desktop only */}
        <div className="hidden md:block absolute top-[28%] right-[8%] z-20 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 bg-zinc-900 text-white text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap">
            ↑ +1,450% impressions
          </span>
        </div>
        {/* Fade out at the bottom so it blends into the next section */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-14">
          {/* Left: text */}
          <div className="flex-1 w-full">
            <h1 className="text-[38px] md:text-[56px] leading-[1.08] font-bold tracking-tight text-zinc-900 mb-5">
              Stop waiting for traffic.
              <br />
              Send it yourself.
            </h1>
            <p className="text-base md:text-[18px] text-zinc-500 leading-relaxed max-w-xl mb-8">
              Type a keyword. Pick your site. Graphref drives real search visits
              to your listing — so you don't have to wait months to move up.
            </p>
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex md:inline-flex items-center justify-center gap-2 bg-zinc-900 text-white text-sm font-medium px-5 py-3.5 rounded-lg hover:bg-zinc-700 transition-colors w-full md:w-auto"
            >
              <MessageCircle size={16} />
              Open on Telegram
            </a>
            <p className="mt-4 text-[13px] text-zinc-400 text-center md:text-left">
              New users get 50 free credits — no card required.
            </p>
          </div>

          {/* Right: Telegram mock chat — hidden on mobile */}
          <div className="hidden lg:flex flex-shrink-0 justify-center">
            <TelegramMockChat />
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-8 px-4 bg-zinc-900">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-0">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className={`flex flex-col items-center gap-1.5 text-center py-4 px-2 ${
                  i < stats.length - 1 ? "border-r border-zinc-700" : ""
                }`}
              >
                <Icon size={15} className="text-zinc-500" />
                <span className="text-xl md:text-[32px] font-bold tracking-tight text-white">{s.value}</span>
                <span className="text-[10px] md:text-[13px] text-zinc-400 leading-tight">{s.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-zinc-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-[28px] font-bold tracking-tight mb-14">
            How it works
          </h2>
          <div className="flex flex-col lg:flex-row gap-16 items-start">
          <div className="w-full max-w-xl flex flex-col flex-shrink-0">

            {/* Step 1 */}
            <div className="flex gap-5">
              <div className="flex flex-col items-center w-9 shrink-0">
                <div className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center shrink-0">
                  <Search size={15} className="text-white" />
                </div>
                <div className="w-px flex-1 bg-zinc-200 mt-2" />
              </div>
              <div className="pb-5 pt-1">
                <p className="text-[15px] font-semibold text-zinc-900 mb-1">Open the bot on Telegram</p>
                <p className="text-[13px] text-zinc-500 leading-relaxed">No account setup. No forms. Just hit Start.</p>
              </div>
            </div>

            {/* Visual 1: START button */}
            <div className="flex gap-5">
              <div className="flex flex-col items-center w-9 shrink-0">
                <div className="w-px flex-1 bg-zinc-200" />
              </div>
              <div className="py-3 pl-0">
                <div className="bg-[#4f81e0] text-white text-[13px] font-semibold px-10 py-2 rounded-xl inline-block shadow-sm">
                  START
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-5">
              <div className="flex flex-col items-center">
                <div className="w-px flex-1 bg-zinc-200 mb-2" />
                <div className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center shrink-0">
                  <Terminal size={15} className="text-white" />
                </div>
                <div className="w-px flex-1 bg-zinc-200 mt-2" />
              </div>
              <div className="py-5 pt-6">
                <p className="text-[15px] font-semibold text-zinc-900 mb-1">Type your keyword and domain</p>
                <p className="text-[13px] text-zinc-500 leading-relaxed">/run your keyword | yoursite.com</p>
              </div>
            </div>

            {/* Visual 2: chat input bar */}
            <div className="flex gap-5">
              <div className="flex flex-col items-center w-9 shrink-0">
                <div className="w-px flex-1 bg-zinc-200" />
              </div>
              <div className="py-3">
                <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-full px-3 py-2 shadow-sm w-72">
                  <span className="flex-1 text-[13px] text-zinc-500 font-mono">
                    /run keyword | yoursite.com
                    <span className="inline-block w-0.5 h-3.5 bg-zinc-400 rounded-full animate-pulse ml-0.5 align-middle" />
                  </span>
                  <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center shrink-0">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-5">
              <div className="flex flex-col items-center">
                <div className="w-px flex-1 bg-zinc-200 mb-2" />
                <div className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center shrink-0">
                  <TrendingUp size={15} className="text-white" />
                </div>
                <div className="w-px flex-1 bg-zinc-200 mt-2" />
              </div>
              <div className="py-5 pt-6">
                <p className="text-[15px] font-semibold text-zinc-900 mb-1">Graphref does the rest</p>
                <p className="text-[13px] text-zinc-500 leading-relaxed">It drives real search visits to your site. You'll see it in Search Console.</p>
              </div>
            </div>

            {/* Visual 3: horizontal ranking card */}
            <div className="flex gap-5">
              <div className="flex flex-col items-center w-9 shrink-0">
                <div className="w-px flex-1 bg-zinc-200" />
              </div>
              <div className="py-3 flex-1 min-w-0">
                <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-4 py-2.5 border-b border-zinc-100 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[11px] font-semibold text-zinc-600">Search Console · Performance</span>
                    <span className="ml-auto text-[11px] text-zinc-400">Last 28 days</span>
                  </div>
                  <div className="flex divide-x divide-zinc-100">
                    {rankingRows.map((row) => (
                      <div key={row.keyword} className="flex-1 px-3 py-3 text-center">
                        <p className="text-[11px] text-zinc-400 truncate mb-1.5">{row.keyword}</p>
                        <div className="flex items-center justify-center gap-2 text-[12px]">
                          <span className="text-zinc-400">#{row.before}</span>
                          <span className="text-zinc-300">→</span>
                          <span className="font-bold text-emerald-600">#{row.after}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>

            {/* Right: SERP mockup */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                {/* Browser chrome */}
                <div className="bg-zinc-100 px-4 py-2.5 flex items-center gap-2 border-b border-zinc-200">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                  </div>
                  <div className="flex-1 bg-white rounded-md px-3 py-1 flex items-center gap-2 border border-zinc-200 mx-3">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    <span className="text-[11px] text-zinc-400">best coffee grinder</span>
                  </div>
                </div>
                {/* SERP results */}
                <div className="px-5 py-4 space-y-4">
                  {/* Sponsored label */}
                  <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">About 4,200,000 results</p>

                  {/* Result 1 — competitor */}
                  <div className="space-y-0.5 opacity-50">
                    <p className="text-[11px] text-zinc-400">bestreviews.com › coffee › grinders</p>
                    <p className="text-[13px] text-blue-600 font-medium">Best Coffee Grinders of 2024 — Expert Picks</p>
                    <p className="text-[11px] text-zinc-500">We tested 30+ grinders so you don't have to. Here are our top picks...</p>
                  </div>

                  {/* Result 2 — competitor */}
                  <div className="space-y-0.5 opacity-50">
                    <p className="text-[11px] text-zinc-400">wirecutter.com › reviews › best-coffee-grinder</p>
                    <p className="text-[13px] text-blue-600 font-medium">The Best Coffee Grinder — Wirecutter</p>
                    <p className="text-[11px] text-zinc-500">After testing dozens of models, we recommend the Baratza Encore...</p>
                  </div>

                  {/* Result 3 — USER's site, highlighted */}
                  <div className="space-y-0.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 relative">
                    <div className="absolute -top-2 right-3 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">↑ #3</div>
                    <p className="text-[11px] text-emerald-600">mycoffeeshop.com › best-coffee-grinder</p>
                    <p className="text-[13px] text-blue-600 font-medium">Best Coffee Grinders — My Coffee Shop</p>
                    <p className="text-[11px] text-zinc-500">Hand-picked grinders for every budget. Free shipping over $50...</p>
                  </div>

                  {/* Result 4 — competitor */}
                  <div className="space-y-0.5 opacity-40">
                    <p className="text-[11px] text-zinc-400">amazon.com › best-sellers › coffee-grinders</p>
                    <p className="text-[13px] text-blue-600 font-medium">Amazon Best Sellers: Coffee Grinders</p>
                    <p className="text-[11px] text-zinc-500">Discover the best Coffee Grinders in Best Sellers...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-28 py-24 px-6 md:scroll-mt-32">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-[28px] font-bold tracking-tight mb-3">
            Pricing
          </h2>
          <p className="text-[15px] text-zinc-500 mb-12">
            Credits never expire. No subscription.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
                <ul className="flex flex-col gap-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[13px]">
                      <CheckCircle
                        size={13}
                        className={`shrink-0 ${plan.highlight ? "text-zinc-400" : "text-zinc-400"}`}
                      />
                      <span className={plan.highlight ? "text-zinc-300" : "text-zinc-600"}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
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
        <div className="max-w-5xl mx-auto">
          <h2 className="text-[28px] font-bold tracking-tight mb-12">
            What people say
          </h2>

          <div className="flex flex-col gap-4">
            {/* Featured card — light, full width */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-8 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="20" height="20" viewBox="0 0 12 12" fill="#facc15">
                      <path d="M6 1l1.3 2.6 2.9.4-2.1 2 .5 2.9L6 7.5 3.4 8.9l.5-2.9L1.8 4l2.9-.4z" />
                    </svg>
                  ))}
                </div>
                <span className="text-[11px] text-zinc-400">{testimonials[0].date}</span>
              </div>
              <p className="text-[20px] text-zinc-700 leading-relaxed italic" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                "{testimonials[0].text}"
              </p>
              <div className="border-t border-zinc-100 pt-4 flex items-center gap-3">
                <img src={testimonials[0].avatar} alt={testimonials[0].name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                <div>
                  <p className="text-[13px] font-semibold text-zinc-900">{testimonials[0].name}</p>
                  <p className="text-[12px] text-zinc-400">{testimonials[0].role}</p>
                </div>
              </div>
            </div>

            {/* Two smaller cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {testimonials.slice(1).map((t) => (
                <div key={t.name} className="bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} width="20" height="20" viewBox="0 0 12 12" fill="#facc15">
                          <path d="M6 1l1.3 2.6 2.9.4-2.1 2 .5 2.9L6 7.5 3.4 8.9l.5-2.9L1.8 4l2.9-.4z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-[11px] text-zinc-400">{t.date}</span>
                  </div>
                  <p className="text-[17px] text-zinc-600 leading-relaxed flex-1 italic" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                    "{t.text}"
                  </p>
                  <div className="flex items-center gap-3 mt-auto pt-2 border-t border-zinc-100">
                    <img src={t.avatar} alt={t.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                    <div>
                      <p className="text-[13px] font-semibold text-zinc-900">{t.name}</p>
                      <p className="text-[12px] text-zinc-400">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-28 py-24 px-6 md:scroll-mt-32">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-[28px] font-bold tracking-tight mb-10">FAQ</h2>
          <div>
            {faqs.map((faq) => (
              <FAQ key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
          <div className="mt-10 flex items-center gap-4 p-5 bg-zinc-50 rounded-xl border border-zinc-100">
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-zinc-900">Still have questions?</p>
              <p className="text-[13px] text-zinc-500 mt-0.5">Can't find what you're looking for? We're happy to help.</p>
            </div>
            <a
              href="/contact"
              className="shrink-0 inline-flex items-center gap-2 bg-zinc-900 text-white text-[13px] font-medium px-4 py-2.5 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Contact us
            </a>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 px-6 bg-zinc-50">
        <div className="max-w-5xl mx-auto">
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
            <a
              href="/contact"
              className="hover:text-zinc-600 transition-colors"
            >
              Contact
            </a>
            <a href="/terms" className="hover:text-zinc-600 transition-colors">
              Terms
            </a>
            <a
              href="/privacy"
              className="hover:text-zinc-600 transition-colors"
            >
              Privacy
            </a>
            <span>© {new Date().getFullYear()} Graphref</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
