import { MessageCircle, Search, Cpu, Bell, CreditCard, RotateCcw, List, Radio, Clock, Zap, CheckCircle2, XCircle, Ban, AlertTriangle } from "lucide-react";
import MarketingHeader from "@/components/MarketingHeader";

export const metadata = {
  title: "Features — Graphref",
  description: "How Graphref works: commands, job pipeline, queue system, and credit mechanics.",
};

const commands = [
  {
    cmd: "/run <keyword> <domain>",
    cost: "10 credits",
    desc: "Enqueues a new search job. Graphref searches for your keyword on Google and clicks your domain in the results.",
    example: "/run best coffee grinder mycoffeeshop.com",
    response: "✅ Job Queued!\n\nKeyword: best coffee grinder\nDomain: mycoffeeshop.com\nCredits remaining: 40\n\nJob ID: a3f9-bc12\nTrack: /status a3f9-bc12",
  },
  {
    cmd: "/status [job_id]",
    cost: "Free",
    desc: "Returns the current state of a job. Omit job_id to check your most recent active job.",
    example: "/status a3f9-bc12",
    response: "🚀 Job Status\n\nStatus: Running\nKeyword: best coffee grinder\nDomain: mycoffeeshop.com\nQueue position: 2\n\nJob ID: a3f9-bc12",
  },
  {
    cmd: "/jobs [n]",
    cost: "Free",
    desc: "Lists your last N jobs (1–10) with their status, keyword, domain, and timestamps.",
    example: "/jobs 5",
    response: "Your last 5 jobs:\n\n1. ✅ best coffee grinder → mycoffeeshop.com\n2. ✅ coffee grinder reviews → mycoffeeshop.com\n3. ❌ espresso machine → mycoffeeshop.com\n4. ✅ pour over coffee → mycoffeeshop.com\n5. ⏳ drip coffee maker → mycoffeeshop.com",
  },
  {
    cmd: "/cancel [job_id]",
    cost: "Refunds 10 credits",
    desc: "Cancels a queued job before it starts. Credits are refunded immediately. Cannot cancel a job that has already started.",
    example: "/cancel a3f9-bc12",
    response: "🛑 Job Cancelled\n\nJob a3f9-bc12 has been cancelled.\n10 credits refunded.\nNew balance: 50 credits",
  },
  {
    cmd: "/queue",
    cost: "Free",
    desc: "Shows current server load: how many jobs are queued globally and how many of yours are active.",
    example: "/queue",
    response: "📊 Queue Status\n\nQueue: jobs\nTotal queued: 14\nYour active jobs: 2",
  },
  {
    cmd: "/credits",
    cost: "Free",
    desc: "Shows your current credit balance and how many /run calls you can make with remaining credits.",
    example: "/credits",
    response: "💳 Credit Balance\n\nBalance: 80 credits\nRuns remaining: 8\n\nNeed more? Use /buy",
  },
  {
    cmd: "/buy",
    cost: "Free",
    desc: "Displays available credit packages with PayPal checkout links. Credits are added instantly after payment.",
    example: "/buy",
    response: "Choose a package:\n\n[100 credits — $1.99]\n[500 credits — $8.99]\n[1000 credits — $15.99]",
  },
  {
    cmd: "/referral",
    cost: "Free",
    desc: "Generates your unique referral link. When someone signs up through your link and completes their first run, you earn 30 bonus credits.",
    example: "/referral",
    response: "🔗 Your referral link:\nt.me/graphrefbot?start=ref_a3f9bc\n\nEarn 30 credits for each person who runs their first job through your link.",
  },
];

const jobStatuses = [
  { status: "queued",   icon: Clock,         iconColor: "text-amber-500",  color: "bg-amber-50 border-amber-200",  textColor: "text-amber-700",  desc: "Job is waiting in the Redis queue. Position depends on server load." },
  { status: "started",  icon: Zap,           iconColor: "text-blue-500",   color: "bg-blue-50 border-blue-200",    textColor: "text-blue-700",   desc: "A worker has picked up the job and is executing the search + click process." },
  { status: "finished", icon: CheckCircle2,  iconColor: "text-emerald-500",color: "bg-emerald-50 border-emerald-200", textColor: "text-emerald-700", desc: "Job completed successfully. Visit will appear in Google Search Console." },
  { status: "failed",   icon: XCircle,       iconColor: "text-red-500",    color: "bg-red-50 border-red-200",      textColor: "text-red-700",    desc: "Execution returned a non-zero exit code. 10 credits are automatically refunded." },
  { status: "canceled", icon: Ban,           iconColor: "text-zinc-400",   color: "bg-zinc-50 border-zinc-200",    textColor: "text-zinc-600",   desc: "User cancelled the job before it started. 10 credits refunded immediately." },
  { status: "stopped",  icon: AlertTriangle, iconColor: "text-orange-500", color: "bg-orange-50 border-orange-200",textColor: "text-orange-700", desc: "Worker was interrupted mid-execution (e.g. server restart). Credits refunded." },
];

const credits = [
  { event: "New account signup", delta: "+50", note: "One-time welcome bonus" },
  { event: "/run command", delta: "−10", note: "Deducted when job is enqueued" },
  { event: "Job fails (any reason)", delta: "+10", note: "Automatic refund, no action needed" },
  { event: "/cancel before start", delta: "+10", note: "Instant refund if job hasn't started" },
  { event: "Referral: their first run", delta: "+30", note: "Credited to referrer after completion" },
  { event: "Buy 100-credit pack", delta: "+100", note: "$1.99 via PayPal" },
  { event: "Buy 500-credit pack", delta: "+500", note: "$8.99 via PayPal" },
  { event: "Buy 1000-credit pack", delta: "+1000", note: "$15.99 via PayPal" },
];

function ChatBubble({ lines, isUser }: { lines: string; isUser?: boolean }) {
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs rounded-2xl px-3.5 py-2.5 text-[12px] leading-snug whitespace-pre-wrap ${
          isUser
            ? "bg-[#4f81e0] text-white rounded-br-sm"
            : "bg-white border border-zinc-100 text-zinc-800 rounded-bl-sm shadow-sm"
        }`}
      >
        {lines}
      </div>
    </div>
  );
}

function CommandCard({ cmd, cost, desc, example, response }: {
  cmd: string; cost: string; desc: string; example: string; response: string; index: number;
}) {
  const isCredit = cost.startsWith("−") || cost === "10 credits";
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100">
        <div className="flex items-start justify-between gap-3">
          <code className="text-[13px] font-mono font-semibold text-zinc-900 bg-zinc-50 px-2 py-1 rounded-md">
            {cmd}
          </code>
          <span className={`shrink-0 text-[11px] font-medium px-2 py-1 rounded-full ${
            isCredit
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : cost.includes("Refund")
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-zinc-100 text-zinc-500"
          }`}>
            {cost}
          </span>
        </div>
        <p className="text-[13px] text-zinc-500 mt-2.5 leading-relaxed">{desc}</p>
      </div>
      <div className="bg-[#f0f2f5] px-4 py-4 flex flex-col gap-2">
        <ChatBubble lines={example} isUser />
        <ChatBubble lines={response} />
      </div>
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <MarketingHeader theme="light" />

      <main className="pt-14">
        {/* Hero */}
        <section className="py-20 px-6 border-b border-zinc-100">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-[40px] font-bold tracking-tight leading-tight mb-5 max-w-2xl">
              A Telegram bot that drives real organic visits to your site
            </h1>
            <p className="text-[16px] text-zinc-500 leading-relaxed max-w-2xl">
              Graphref operates a pool of real devices. When you submit a job, those devices perform an actual Google search for your keyword, locate your domain in the results, and click through. Google registers it as genuine organic traffic — which you can verify in Search Console.
            </p>
          </div>
        </section>

        {/* Pipeline diagram */}
        <section className="py-20 px-6 bg-zinc-950 border-b border-zinc-800">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-[22px] font-bold tracking-tight mb-2 text-white">Job pipeline</h2>
            <p className="text-[14px] text-zinc-400 mb-12">From your command to a click in Google — every step in the process.</p>

            <div className="relative">
              {/* Desktop horizontal flow */}
              <div className="hidden md:flex items-stretch gap-0">
                {[
                  { icon: MessageCircle, label: "You send", detail: "/run keyword domain", sub: "via Telegram bot", iconColor: "text-blue-400" },
                  { icon: List, label: "Job enqueued", detail: "Redis queue", sub: "10 credits deducted", iconColor: "text-amber-400" },
                  { icon: Cpu, label: "Worker picks up", detail: "Real device executes", sub: "run.py subprocess", iconColor: "text-violet-400" },
                  { icon: Search, label: "Google search", detail: "Searches keyword", sub: "clicks your domain", iconColor: "text-emerald-400" },
                  { icon: Bell, label: "You're notified", detail: "Bot sends result", sub: "visible in GSC", iconColor: "text-zinc-400" },
                ].map((step, i, arr) => (
                  <div key={i} className="flex items-stretch flex-1">
                    <div className="flex-1 border border-zinc-700 rounded-xl p-5 flex flex-col items-center text-center gap-2.5 bg-zinc-900">
                      <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                        <step.icon size={16} className={step.iconColor} />
                      </div>
                      <p className="text-[13px] font-semibold text-zinc-100 leading-snug">{step.label}</p>
                      <p className="text-[11px] font-mono text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">{step.detail}</p>
                      <p className="text-[11px] text-zinc-500">{step.sub}</p>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="flex items-center px-1.5 shrink-0">
                        <svg width="18" height="12" viewBox="0 0 18 12">
                          <path d="M0 6 L12 6 M9 2 L13 6 L9 10" stroke="#71717a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Mobile vertical flow */}
              <div className="flex md:hidden flex-col gap-3">
                {[
                  { icon: MessageCircle, label: "You send /run keyword domain", sub: "via Telegram bot", iconColor: "text-blue-400" },
                  { icon: List, label: "Job enqueued in Redis queue", sub: "10 credits deducted", iconColor: "text-amber-400" },
                  { icon: Cpu, label: "Worker picks up and executes", sub: "run.py subprocess on real device", iconColor: "text-violet-400" },
                  { icon: Search, label: "Google search performed", sub: "Finds your domain, clicks it", iconColor: "text-emerald-400" },
                  { icon: Bell, label: "Bot notifies you with result", sub: "Appears in Google Search Console", iconColor: "text-zinc-400" },
                ].map((step, i, arr) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-full border border-zinc-700 rounded-xl p-4 flex items-center gap-3 bg-zinc-900">
                      <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                        <step.icon size={16} className={step.iconColor} />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-zinc-100">{step.label}</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">{step.sub}</p>
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="py-1">
                        <svg width="12" height="18" viewBox="0 0 12 18">
                          <path d="M6 0 L6 12 M2 9 L6 13 L10 9" stroke="#71717a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Queue detail */}
            <div className="mt-12 grid md:grid-cols-2 gap-6">
              <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Radio size={15} className="text-violet-400" />
                  <h3 className="text-[14px] font-semibold text-zinc-100">Queue &amp; workers</h3>
                </div>
                <p className="text-[13px] text-zinc-400 leading-relaxed mb-4">
                  Jobs are stored in a Redis-backed queue (RQ). Workers continuously pull jobs in order and execute them. Multiple workers can run in parallel, which is why server load affects queue time.
                </p>
                <div className="bg-zinc-800 rounded-xl p-4 font-mono text-[11px] text-zinc-400 space-y-1">
                  <div><span className="text-zinc-500">queue</span> <span className="text-emerald-400">jobs</span></div>
                  <div><span className="text-zinc-500">position</span> 3 <span className="text-zinc-500">of</span> 14</div>
                  <div><span className="text-zinc-500">timeout</span> 30 min max</div>
                  <div><span className="text-zinc-500">on timeout</span> <span className="text-amber-400">auto-refund</span></div>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <RotateCcw size={15} className="text-emerald-400" />
                  <h3 className="text-[14px] font-semibold text-zinc-100">Auto-refund policy</h3>
                </div>
                <p className="text-[13px] text-zinc-400 leading-relaxed mb-4">
                  Credits are refunded automatically for any job that doesn&apos;t complete successfully — network errors, invalid domain, worker interruption, or timeout. No manual request needed.
                </p>
                <div className="space-y-2">
                  {["failed (non-zero exit)", "stopped (worker restart)", "canceled by user", "timeout after 30 min"].map((reason) => (
                    <div key={reason} className="flex items-center gap-2 text-[12px]">
                      <span className="text-emerald-400">+10</span>
                      <span className="text-zinc-400">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Job statuses */}
        <section className="py-20 px-6 border-b border-zinc-200 bg-white">
          <div className="max-w-5xl mx-auto">

            {/* Paper-style header */}
            <div className="mb-10 pb-6 border-b-2 border-zinc-900">
              <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.2em] mb-3">§ 2 — State machine</p>
              <h2 className="text-[28px] font-bold tracking-tight text-zinc-900">Job lifecycle</h2>
              <p className="text-[13px] text-zinc-500 mt-2 max-w-2xl leading-relaxed">
                Every job transitions through a finite set of states. State changes are atomic; the bot delivers a notification on each terminal transition.
              </p>
            </div>

            {/* Table-style status list */}
            <div className="border border-zinc-200 overflow-hidden rounded-sm mb-10">
              <table className="w-full text-[13px] border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="text-left px-5 py-2.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest w-36">State</th>
                    <th className="text-left px-5 py-2.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Description</th>
                    <th className="text-left px-5 py-2.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest w-24 hidden sm:table-cell">Terminal</th>
                  </tr>
                </thead>
                <tbody>
                  {jobStatuses.map((s, i) => (
                    <tr key={s.status} className="border-b border-zinc-100 last:border-0">
                      <td className="px-5 py-3.5 align-top">
                        <div className="flex items-center gap-2">
                          <s.icon size={13} className={s.iconColor} />
                          <code className={`text-[12px] font-mono font-semibold ${s.textColor}`}>{s.status}</code>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-500 leading-relaxed text-[12px]">{s.desc}</td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className={`text-[11px] font-mono ${["finished","failed","canceled"].includes(s.status) ? "text-zinc-400" : "text-zinc-200"}`}>
                          {["finished","failed","canceled"].includes(s.status) ? "yes" : "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* State transition diagram */}
            <div className="border border-zinc-200 rounded-sm p-6 overflow-x-auto bg-zinc-50/50">
              <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1">Figure 1.</p>
              <p className="text-[12px] text-zinc-500 mb-6">State transition diagram — solid lines denote nominal flow; dashed lines denote error / cancellation paths with automatic credit refund.</p>
              <svg viewBox="0 0 680 122" className="w-full min-w-[500px]" height="122">
                <defs>
                  <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6" fill="none" stroke="#71717a" strokeWidth="1.2" />
                  </marker>
                  <marker id="arrf" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6" fill="none" stroke="#f87171" strokeWidth="1.2" />
                  </marker>
                </defs>

                {/* Boxes */}
                <rect x="20"  y="14" width="104" height="36" rx="3" fill="#ffffff" stroke="#d97706" strokeWidth="1.5" />
                <text x="72"  y="37" textAnchor="middle" fontSize="11" fontFamily="monospace" fill="#1c1917">queued</text>

                <rect x="192" y="14" width="104" height="36" rx="3" fill="#ffffff" stroke="#3b82f6" strokeWidth="1.5" />
                <text x="244" y="37" textAnchor="middle" fontSize="11" fontFamily="monospace" fill="#1c1917">started</text>

                <rect x="364" y="14" width="104" height="36" rx="3" fill="#ffffff" stroke="#10b981" strokeWidth="1.5" />
                <text x="416" y="37" textAnchor="middle" fontSize="11" fontFamily="monospace" fill="#1c1917">finished</text>

                <rect x="536" y="14" width="120" height="36" rx="3" fill="#ffffff" stroke="#ef4444" strokeWidth="1.5" />
                <text x="596" y="29" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#1c1917">failed /</text>
                <text x="596" y="43" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#1c1917">stopped</text>

                {/* Main arrows */}
                <path d="M124 32 L188 32" stroke="#71717a" strokeWidth="1.5" fill="none" markerEnd="url(#arr)" />
                <path d="M296 32 L360 32" stroke="#71717a" strokeWidth="1.5" fill="none" markerEnd="url(#arr)" />
                <text x="156" y="10" fontSize="9" fill="#a1a1aa" textAnchor="middle">worker picks up</text>
                <text x="328" y="10" fontSize="9" fill="#a1a1aa" textAnchor="middle">exit 0</text>

                {/* Error paths */}
                <path d="M244 50 L244 78 L596 78 L596 50" stroke="#f87171" strokeWidth="1.2" fill="none" strokeDasharray="4,2.5" markerEnd="url(#arrf)" />
                <text x="420" y="93" fontSize="9" fill="#f87171" textAnchor="middle">exit ≠ 0 → refund</text>

                <path d="M72 50 L72 100 L536 100 L536 50" stroke="#f87171" strokeWidth="1.2" fill="none" strokeDasharray="4,2.5" markerEnd="url(#arrf)" />
                <text x="304" y="116" fontSize="9" fill="#f87171" textAnchor="middle">/cancel → refund</text>
              </svg>
            </div>

          </div>
        </section>

        {/* Commands */}
        <section className="py-20 px-6 border-b border-zinc-100 bg-zinc-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-[22px] font-bold tracking-tight mb-2">All commands</h2>
            <p className="text-[14px] text-zinc-500 mb-10">Every command the bot supports, with real examples of what you send and what you get back.</p>
            <div className="grid md:grid-cols-2 gap-4">
              {commands.map((c, i) => (
                <CommandCard key={i} {...c} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* Credit system */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-[22px] font-bold tracking-tight mb-2">Credit system</h2>
            <p className="text-[14px] text-zinc-500 mb-10">Credits never expire. Every transaction is logged and visible via /credits.</p>

            <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-3 px-5 py-3 bg-zinc-50 border-b border-zinc-100 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                <span>Event</span>
                <span className="text-center">Credits</span>
                <span>Note</span>
              </div>
              {credits.map((row, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-3 px-5 py-3.5 text-[13px] items-center ${i < credits.length - 1 ? "border-b border-zinc-100" : ""}`}
                >
                  <span className="text-zinc-700">{row.event}</span>
                  <span className={`text-center font-mono font-semibold ${
                    row.delta.startsWith("+") ? "text-emerald-600" : "text-red-500"
                  }`}>{row.delta}</span>
                  <span className="text-zinc-400 text-[12px]">{row.note}</span>
                </div>
              ))}
            </div>

            {/* Referral visual */}
            <div className="mt-8 bg-white border border-zinc-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard size={15} className="text-zinc-500" />
                <h3 className="text-[14px] font-semibold text-zinc-900">Referral bonus</h3>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-[14px] font-bold text-zinc-600">A</div>
                  <div>
                    <p className="text-[13px] font-medium text-zinc-800">You share your link</p>
                    <p className="text-[11px] text-zinc-400 font-mono">t.me/graphrefbot?start=ref_xxx</p>
                  </div>
                </div>
                <svg width="32" height="16" viewBox="0 0 32 16" className="shrink-0 hidden sm:block">
                  <path d="M0 8 L26 8 M20 3 L26 8 L20 13" stroke="#d4d4d8" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                </svg>
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-[14px] font-bold text-zinc-600">B</div>
                  <div>
                    <p className="text-[13px] font-medium text-zinc-800">Friend signs up + runs first job</p>
                    <p className="text-[11px] text-zinc-400">triggers bonus</p>
                  </div>
                </div>
                <svg width="32" height="16" viewBox="0 0 32 16" className="shrink-0 hidden sm:block">
                  <path d="M0 8 L26 8 M20 3 L26 8 L20 13" stroke="#d4d4d8" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                </svg>
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-[13px] font-bold text-emerald-700">+30</div>
                  <div>
                    <p className="text-[13px] font-medium text-zinc-800">You receive 30 credits</p>
                    <p className="text-[11px] text-zinc-400">added to your balance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6 border-t border-zinc-100 bg-zinc-50">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-[18px] font-bold text-zinc-900">Ready to try it?</p>
              <p className="text-[14px] text-zinc-500 mt-1">New accounts start with 50 free credits — no card required.</p>
            </div>
            <a
              href="https://t.me/graphrefbot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-zinc-900 text-white text-[13px] font-medium px-5 py-3 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              <MessageCircle size={15} />
              Open on Telegram
            </a>
          </div>
        </section>

        <footer className="border-t border-zinc-100 py-8 px-6">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-zinc-400">
            <span>© 2026 Graphref</span>
            <div className="flex gap-5">
              <a href="/features" className="hover:text-zinc-700 transition-colors font-medium text-zinc-600">Features</a>
              <a href="/about" className="hover:text-zinc-700 transition-colors">About</a>
              <a href="/contact" className="hover:text-zinc-700 transition-colors">Contact</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
