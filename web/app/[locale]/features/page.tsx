import { MessageCircle, Search, Cpu, Bell, CreditCard, RotateCcw, List, Radio } from "lucide-react";
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
  { status: "queued", emoji: "⏳", color: "bg-amber-50 border-amber-200 text-amber-700", desc: "Job is waiting in the Redis queue. Position depends on server load." },
  { status: "started", emoji: "🚀", color: "bg-blue-50 border-blue-200 text-blue-700", desc: "A worker has picked up the job and is executing the search + click process." },
  { status: "finished", emoji: "✅", color: "bg-emerald-50 border-emerald-200 text-emerald-700", desc: "Job completed successfully. Visit will appear in Google Search Console." },
  { status: "failed", emoji: "❌", color: "bg-red-50 border-red-200 text-red-700", desc: "Execution returned a non-zero exit code. 10 credits are automatically refunded." },
  { status: "canceled", emoji: "🛑", color: "bg-zinc-50 border-zinc-200 text-zinc-600", desc: "User cancelled the job before it started. 10 credits refunded immediately." },
  { status: "stopped", emoji: "⚠️", color: "bg-orange-50 border-orange-200 text-orange-700", desc: "Worker was interrupted mid-execution (e.g. server restart). Credits refunded." },
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
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-6">
              <span className="w-4 h-px bg-zinc-300" />
              How it actually works
            </div>
            <h1 className="text-[40px] font-bold tracking-tight leading-tight mb-5 max-w-2xl">
              A Telegram bot that drives real organic visits to your site
            </h1>
            <p className="text-[16px] text-zinc-500 leading-relaxed max-w-2xl">
              Graphref operates a pool of real devices. When you submit a job, those devices perform an actual Google search for your keyword, locate your domain in the results, and click through. Google registers it as genuine organic traffic — which you can verify in Search Console.
            </p>
          </div>
        </section>

        {/* Pipeline diagram */}
        <section className="py-20 px-6 bg-zinc-50 border-b border-zinc-100">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-[22px] font-bold tracking-tight mb-2">Job pipeline</h2>
            <p className="text-[14px] text-zinc-500 mb-12">From your command to a click in Google — every step in the process.</p>

            <div className="relative">
              {/* Desktop horizontal flow */}
              <div className="hidden md:flex items-stretch gap-0">
                {[
                  { icon: MessageCircle, label: "You send", detail: "/run keyword domain", sub: "via Telegram bot", color: "bg-blue-50 border-blue-200", iconColor: "text-blue-500" },
                  { icon: List, label: "Job enqueued", detail: "Redis queue", sub: "10 credits deducted", color: "bg-amber-50 border-amber-200", iconColor: "text-amber-500" },
                  { icon: Cpu, label: "Worker picks up", detail: "Real device executes", sub: "run.py subprocess", color: "bg-violet-50 border-violet-200", iconColor: "text-violet-500" },
                  { icon: Search, label: "Google search", detail: "Searches your keyword", sub: "clicks your domain", color: "bg-emerald-50 border-emerald-200", iconColor: "text-emerald-500" },
                  { icon: Bell, label: "You're notified", detail: "Bot sends result", sub: "visible in GSC", color: "bg-zinc-50 border-zinc-200", iconColor: "text-zinc-500" },
                ].map((step, i, arr) => (
                  <div key={i} className="flex items-center flex-1">
                    <div className={`flex-1 border rounded-xl p-4 flex flex-col items-center text-center gap-2 ${step.color}`}>
                      <div className={`w-9 h-9 rounded-full bg-white border flex items-center justify-center ${step.color}`}>
                        <step.icon size={16} className={step.iconColor} />
                      </div>
                      <p className="text-[12px] font-semibold text-zinc-700 leading-tight">{step.label}</p>
                      <p className="text-[11px] font-mono text-zinc-800 bg-white/70 px-2 py-0.5 rounded">{step.detail}</p>
                      <p className="text-[10px] text-zinc-400">{step.sub}</p>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="flex items-center px-2">
                        <svg width="20" height="12" viewBox="0 0 20 12">
                          <path d="M0 6 L14 6 M10 2 L14 6 L10 10" stroke="#d4d4d8" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Mobile vertical flow */}
              <div className="flex md:hidden flex-col gap-3">
                {[
                  { icon: MessageCircle, label: "You send /run keyword domain", sub: "via Telegram bot", color: "bg-blue-50 border-blue-200", iconColor: "text-blue-500" },
                  { icon: List, label: "Job enqueued in Redis queue", sub: "10 credits deducted", color: "bg-amber-50 border-amber-200", iconColor: "text-amber-500" },
                  { icon: Cpu, label: "Worker picks up and executes", sub: "run.py subprocess on real device", color: "bg-violet-50 border-violet-200", iconColor: "text-violet-500" },
                  { icon: Search, label: "Google search performed", sub: "Finds your domain, clicks it", color: "bg-emerald-50 border-emerald-200", iconColor: "text-emerald-500" },
                  { icon: Bell, label: "Bot notifies you with result", sub: "Appears in Google Search Console", color: "bg-zinc-50 border-zinc-200", iconColor: "text-zinc-500" },
                ].map((step, i, arr) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className={`w-full border rounded-xl p-4 flex items-center gap-3 ${step.color}`}>
                      <div className={`w-9 h-9 rounded-full bg-white border flex items-center justify-center shrink-0 ${step.color}`}>
                        <step.icon size={16} className={step.iconColor} />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-zinc-800">{step.label}</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{step.sub}</p>
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="py-1 text-zinc-300 text-lg">↓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Queue detail */}
            <div className="mt-12 grid md:grid-cols-2 gap-6">
              <div className="bg-white border border-zinc-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Radio size={15} className="text-violet-500" />
                  <h3 className="text-[14px] font-semibold text-zinc-900">Queue &amp; workers</h3>
                </div>
                <p className="text-[13px] text-zinc-500 leading-relaxed mb-4">
                  Jobs are stored in a Redis-backed queue (RQ). Workers continuously pull jobs in order and execute them. Multiple workers can run in parallel, which is why server load affects queue time.
                </p>
                <div className="bg-zinc-50 rounded-xl p-4 font-mono text-[11px] text-zinc-600 space-y-1">
                  <div><span className="text-zinc-400">queue</span> <span className="text-emerald-600">jobs</span></div>
                  <div><span className="text-zinc-400">position</span> 3 <span className="text-zinc-400">of</span> 14</div>
                  <div><span className="text-zinc-400">timeout</span> 30 min max</div>
                  <div><span className="text-zinc-400">on timeout</span> <span className="text-amber-600">auto-refund</span></div>
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <RotateCcw size={15} className="text-emerald-500" />
                  <h3 className="text-[14px] font-semibold text-zinc-900">Auto-refund policy</h3>
                </div>
                <p className="text-[13px] text-zinc-500 leading-relaxed mb-4">
                  Credits are refunded automatically for any job that doesn&apos;t complete successfully — network errors, invalid domain, worker interruption, or timeout. No manual request needed.
                </p>
                <div className="space-y-2">
                  {["failed (non-zero exit)", "stopped (worker restart)", "canceled by user", "timeout after 30 min"].map((reason) => (
                    <div key={reason} className="flex items-center gap-2 text-[12px]">
                      <span className="text-emerald-500">+10</span>
                      <span className="text-zinc-500">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Job statuses */}
        <section className="py-20 px-6 border-b border-zinc-100">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-[22px] font-bold tracking-tight mb-2">Job lifecycle</h2>
            <p className="text-[14px] text-zinc-500 mb-10">Every job moves through these states. The bot notifies you when a job leaves the active states.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobStatuses.map((s) => (
                <div key={s.status} className={`border rounded-xl p-4 ${s.color}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{s.emoji}</span>
                    <code className="text-[12px] font-mono font-semibold">{s.status}</code>
                  </div>
                  <p className="text-[12px] leading-relaxed opacity-80">{s.desc}</p>
                </div>
              ))}
            </div>

            {/* State transition diagram */}
            <div className="mt-10 bg-zinc-50 border border-zinc-200 rounded-2xl p-6 overflow-x-auto">
              <p className="text-[12px] font-semibold text-zinc-500 uppercase tracking-wider mb-5">State transitions</p>
              <svg viewBox="0 0 680 80" className="w-full min-w-[500px]" height="80">
                {[
                  { x: 30, label: "queued", fill: "#fef3c7", stroke: "#f59e0b" },
                  { x: 190, label: "started", fill: "#dbeafe", stroke: "#3b82f6" },
                ].map((n) => (
                  <g key={n.x + n.label}>
                    <rect x={n.x} y="20" width="100" height="36" rx="8" fill={n.fill} stroke={n.stroke} strokeWidth="1.5" />
                    <text x={n.x + 50} y="43" textAnchor="middle" fontSize="11" fontFamily="monospace" fill="#374151">{n.label}</text>
                  </g>
                ))}
                <rect x={370} y="20" width="100" height="36" rx="8" fill="#d1fae5" stroke="#10b981" strokeWidth="1.5" />
                <text x={420} y="43" textAnchor="middle" fontSize="11" fontFamily="monospace" fill="#374151">finished</text>
                <rect x={540} y="20" width="110" height="36" rx="8" fill="#fee2e2" stroke="#ef4444" strokeWidth="1.5" />
                <text x={595} y="38" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#374151">failed /</text>
                <text x={595} y="50" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#374151">stopped</text>
                <path d="M130 38 L185 38" stroke="#d4d4d8" strokeWidth="1.5" fill="none" markerEnd="url(#arr)" />
                <path d="M290 38 L365 38" stroke="#d4d4d8" strokeWidth="1.5" fill="none" markerEnd="url(#arr)" />
                <path d="M290 44 Q330 72 535 44" stroke="#fca5a5" strokeWidth="1.5" fill="none" strokeDasharray="3,2" markerEnd="url(#arrf)" />
                <path d="M80 56 Q80 74 535 56" stroke="#fca5a5" strokeWidth="1.5" fill="none" strokeDasharray="3,2" markerEnd="url(#arrf)" />
                <text x="200" y="28" fontSize="9" fill="#9ca3af" textAnchor="middle">worker picks up</text>
                <text x="328" y="28" fontSize="9" fill="#9ca3af" textAnchor="middle">exit 0</text>
                <text x="355" y="72" fontSize="9" fill="#fca5a5" textAnchor="middle">exit ≠ 0 → refund</text>
                <text x="140" y="78" fontSize="9" fill="#fca5a5" textAnchor="middle">/cancel → refund</text>
                <defs>
                  <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6" fill="none" stroke="#d4d4d8" strokeWidth="1" />
                  </marker>
                  <marker id="arrf" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6" fill="none" stroke="#fca5a5" strokeWidth="1" />
                  </marker>
                </defs>
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
