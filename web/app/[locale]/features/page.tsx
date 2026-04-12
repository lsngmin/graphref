import { MessageCircle, Search, Cpu, Bell, RotateCcw, List, Radio, Clock, Zap, CheckCircle2, XCircle, Ban, AlertTriangle, MousePointerClick, Globe, Eye, ShieldCheck, Fingerprint, Timer, Wifi } from "lucide-react";
import Header from "@/components/Header";

export const metadata = {
  title: "Features — Graphref",
  description: "How Graphref works: commands, job pipeline, queue system, and credit mechanics.",
  openGraph: {
    title: "Features — Graphref",
    description: "How Graphref works: commands, job pipeline, queue system, and credit mechanics.",
    url: "https://graphref.com/features",
  },
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
      <Header activePage="features" theme="light" />

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
        <section className="py-20 px-6 border-b border-zinc-100">
          <div className="max-w-5xl mx-auto">

            <h2 className="text-[22px] font-bold tracking-tight mb-2">Job lifecycle</h2>
            <p className="text-[14px] text-zinc-500 mb-10">Every job moves through these states. The bot notifies you when a job leaves the active states.</p>

            {/* Job log feed */}
            <div className="rounded-2xl border border-zinc-200 overflow-hidden mb-10">
              {/* Header bar */}
              <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-2.5 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
                <span className="ml-2 text-[11px] font-mono text-zinc-400">job a3f9-bc12 · log</span>
              </div>

              {/* Log lines */}
              <div className="bg-white px-5 py-2 font-mono text-[12px] divide-y divide-zinc-100">
                {[
                  { time: "10:42:01", status: "queued",   dot: "bg-amber-400",   label: "text-amber-500",  desc: "Job is waiting in the Redis queue. Position depends on server load." },
                  { time: "10:42:08", status: "started",  dot: "bg-blue-400",    label: "text-blue-500",   desc: "A worker has picked up the job and is executing the search + click process." },
                  { time: "10:43:11", status: "finished", dot: "bg-emerald-400", label: "text-emerald-600",desc: "Job completed successfully. Visit will appear in Google Search Console." },
                  { time: "—",        status: "failed",   dot: "bg-red-400",     label: "text-red-500",    desc: "Execution returned a non-zero exit code. 10 credits are automatically refunded." },
                  { time: "—",        status: "stopped",  dot: "bg-orange-400",  label: "text-orange-500", desc: "Worker was interrupted mid-execution (e.g. server restart). Credits refunded." },
                  { time: "—",        status: "canceled", dot: "bg-zinc-300",    label: "text-zinc-400",   desc: "User cancelled the job before it started. 10 credits refunded immediately." },
                ].map((row, i) => (
                  <div key={row.status} className={`flex items-start gap-4 py-3 ${i >= 3 ? "opacity-50" : ""}`}>
                    <span className="text-zinc-300 w-16 shrink-0 pt-0.5">{row.time}</span>
                    <span className="flex items-center gap-1.5 w-24 shrink-0 pt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${row.dot}`} />
                      <span className={`font-semibold ${row.label}`}>{row.status}</span>
                    </span>
                    <span className="text-zinc-400 leading-relaxed">{row.desc}</span>
                  </div>
                ))}
              </div>

              {/* Footer note */}
              <div className="bg-zinc-50 border-t border-zinc-100 px-5 py-2.5">
                <span className="text-[11px] font-mono text-zinc-400">failed / stopped / canceled → credits refunded automatically</span>
              </div>
            </div>

            {/* State transition diagram */}
            <div className="mt-10 bg-zinc-50 border border-zinc-200 rounded-2xl p-6 overflow-x-auto">
              <p className="text-[12px] font-semibold text-zinc-500 uppercase tracking-wider mb-5">State transitions</p>
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
                <rect x="20"  y="14" width="104" height="36" rx="7" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
                <text x="72"  y="37" textAnchor="middle" fontSize="11" fontFamily="monospace" fill="#374151">queued</text>

                <rect x="192" y="14" width="104" height="36" rx="7" fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
                <text x="244" y="37" textAnchor="middle" fontSize="11" fontFamily="monospace" fill="#374151">started</text>

                <rect x="364" y="14" width="104" height="36" rx="7" fill="#d1fae5" stroke="#10b981" strokeWidth="1.5" />
                <text x="416" y="37" textAnchor="middle" fontSize="11" fontFamily="monospace" fill="#374151">finished</text>

                <rect x="536" y="14" width="120" height="36" rx="7" fill="#fee2e2" stroke="#ef4444" strokeWidth="1.5" />
                <text x="596" y="29" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#374151">failed /</text>
                <text x="596" y="43" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#374151">stopped</text>

                {/* Main arrows */}
                <path d="M124 32 L188 32" stroke="#71717a" strokeWidth="1.5" fill="none" markerEnd="url(#arr)" />
                <path d="M296 32 L360 32" stroke="#71717a" strokeWidth="1.5" fill="none" markerEnd="url(#arr)" />
                <text x="156" y="10" fontSize="9" fill="#9ca3af" textAnchor="middle">worker picks up</text>
                <text x="328" y="10" fontSize="9" fill="#9ca3af" textAnchor="middle">exit 0</text>

                {/* Error paths */}
                <path d="M244 50 L244 78 L596 78 L596 50" stroke="#fca5a5" strokeWidth="1.5" fill="none" strokeDasharray="3,2" markerEnd="url(#arrf)" />
                <text x="420" y="94" fontSize="9" fill="#fca5a5" textAnchor="middle">exit ≠ 0 → refund</text>

                <path d="M72 50 L72 100 L536 100 L536 50" stroke="#fca5a5" strokeWidth="1.5" fill="none" strokeDasharray="3,2" markerEnd="url(#arrf)" />
                <text x="304" y="116" fontSize="9" fill="#fca5a5" textAnchor="middle">/cancel → refund</text>
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

        {/* Worker execution deep-dive */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-[22px] font-bold tracking-tight mb-2">Inside the worker</h2>
            <p className="text-[14px] text-zinc-500 mb-12">What actually happens between &ldquo;worker picks up&rdquo; and &ldquo;job finished&rdquo; — every step the real device takes.</p>

            {/* Step-by-step breakdown */}
            <div className="relative">
              {/* Vertical connector line */}
              <div className="absolute left-[19px] top-6 bottom-6 w-px bg-zinc-200 hidden md:block" />

              <div className="space-y-4">
                {[
                  {
                    n: "1",
                    icon: Cpu,
                    iconColor: "text-violet-500",
                    bg: "bg-violet-50 border-violet-200",
                    label: "Worker dequeues the job",
                    body: "An idle worker process polls the Redis queue and atomically pops the next job. The job transitions from queued → started and is locked so no other worker can claim it.",
                    code: "worker.dequeue()  # job_id: a3f9-bc12\nstatus → started",
                  },
                  {
                    n: "2",
                    icon: Globe,
                    iconColor: "text-blue-500",
                    bg: "bg-blue-50 border-blue-200",
                    label: "Real browser launches",
                    body: "The worker spawns run.py as a subprocess on a real device. A headless Chromium instance starts with a unique user-agent and viewport — indistinguishable from a normal desktop session.",
                    code: "subprocess.run(['python', 'run.py',\n  '--keyword', 'best coffee grinder',\n  '--domain',  'mycoffeeshop.com'])",
                  },
                  {
                    n: "3",
                    icon: Search,
                    iconColor: "text-emerald-500",
                    bg: "bg-emerald-50 border-emerald-200",
                    label: "Google search is performed",
                    body: "The browser navigates to google.com and types the keyword into the search box. The search is submitted and the SERP (Search Engine Results Page) loads fully before any action is taken.",
                    code: "navigate → google.com\ntype     → \"best coffee grinder\"\nwait     → SERP fully loaded",
                  },
                  {
                    n: "4",
                    icon: Eye,
                    iconColor: "text-amber-500",
                    bg: "bg-amber-50 border-amber-200",
                    label: "Results scanned for your domain",
                    body: "The script iterates through organic result links, checking each href for a match to your domain. If the domain appears in the top results it proceeds; otherwise the job exits with a non-zero code and credits are refunded.",
                    code: "for result in serp.organic_results:\n  if domain in result.url:\n    target = result  # found ✓\n    break",
                  },
                  {
                    n: "5",
                    icon: MousePointerClick,
                    iconColor: "text-rose-500",
                    bg: "bg-rose-50 border-rose-200",
                    label: "Domain link is clicked",
                    body: "The target link receives a real mouse-click event (not a direct navigation). The browser follows the redirect chain exactly as a human visitor would — including Google's click-tracking URL — then waits for the page to fully load before the job is marked finished.",
                    code: "target.click()  # real mouse event\n# browser follows google redirect\n# lands on mycoffeeshop.com",
                  },
                ].map((step) => (
                  <div key={step.n} className="md:pl-10 flex flex-col gap-0">
                    {/* Step header */}
                    <div className="flex items-start gap-4">
                      {/* Circle number (desktop only, absolutely positioned over the line) */}
                      <div className="hidden md:flex absolute left-0 w-10 h-10 rounded-full bg-white border-2 border-zinc-200 items-center justify-center shrink-0">
                        <span className="text-[11px] font-bold text-zinc-500">{step.n}</span>
                      </div>

                      {/* Card */}
                      <div className="flex-1 border border-zinc-200 rounded-2xl overflow-hidden">
                        <div className="flex items-center gap-3 px-5 py-4 bg-zinc-50 border-b border-zinc-100">
                          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${step.bg}`}>
                            <step.icon size={15} className={step.iconColor} />
                          </div>
                          <p className="text-[14px] font-semibold text-zinc-900">{step.label}</p>
                          <span className="ml-auto text-[11px] font-mono text-zinc-400 hidden sm:block">step {step.n} / 5</span>
                        </div>
                        <div className="px-5 py-4 flex flex-col sm:flex-row gap-4">
                          <p className="text-[13px] text-zinc-500 leading-relaxed flex-1">{step.body}</p>
                          <div className="sm:w-64 shrink-0 bg-zinc-900 rounded-xl px-4 py-3 font-mono text-[11px] text-zinc-300 whitespace-pre leading-relaxed">
                            {step.code}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>


        {/* Anti-detection */}
        <section className="py-20 px-6 border-b border-zinc-100">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-[22px] font-bold tracking-tight mb-2">How Graphref avoids low-quality traffic flags</h2>
            <p className="text-[14px] text-zinc-500 mb-10">Google&apos;s systems look for patterns that separate automated activity from genuine users. Graphref is built around passing every one of them.</p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  icon: Fingerprint,
                  iconColor: "text-violet-500",
                  bg: "bg-violet-50",
                  title: "Real browser fingerprint",
                  body: "A physical device runs a standard Chromium build with no automation flags. Canvas, WebGL, audio, and font fingerprints match a normal desktop browser — nothing headless-specific is exposed.",
                },
                {
                  icon: Globe,
                  iconColor: "text-blue-500",
                  bg: "bg-blue-50",
                  title: "Click routed through Google",
                  body: "The click follows Google's /url?q= redirect chain before landing on your site. This is what Google's click-through measurement infrastructure expects to see — a direct navigation would register as referral traffic, not organic.",
                },
                {
                  icon: Wifi,
                  iconColor: "text-emerald-500",
                  bg: "bg-emerald-50",
                  title: "Unique IP per session",
                  body: "Each job runs from a distinct residential IP address. No repeated subnet patterns, no datacenter ranges. IP reputation is clean and geographically varied.",
                },
                {
                  icon: Timer,
                  iconColor: "text-amber-500",
                  bg: "bg-amber-50",
                  title: "Human-paced timing",
                  body: "Keystrokes, mouse movements, and page interactions are paced with randomised delays. No sub-millisecond precision that would stand out in event timing analysis.",
                },
                {
                  icon: Eye,
                  iconColor: "text-rose-500",
                  bg: "bg-rose-50",
                  title: "Dwell time, not bounce",
                  body: "The browser waits for the full page load and remains on the destination for a natural duration. Immediate exits are a strong signal of bot activity — Graphref never bounces.",
                },
                {
                  icon: ShieldCheck,
                  iconColor: "text-teal-500",
                  bg: "bg-teal-50",
                  title: "No repetitive patterns",
                  body: "Jobs from different users are interleaved in the queue. No single keyword or domain is hit at a metronomic interval. Traffic variance mirrors organic user behaviour.",
                },
              ].map((card) => (
                <div key={card.title} className="border border-zinc-200 rounded-2xl p-5">
                  <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                    <card.icon size={16} className={card.iconColor} />
                  </div>
                  <p className="text-[13px] font-semibold text-zinc-900 mb-1.5">{card.title}</p>
                  <p className="text-[12px] text-zinc-500 leading-relaxed">{card.body}</p>
                </div>
              ))}
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
