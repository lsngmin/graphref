export default function Contact() {
  return (
    <main className="min-h-screen bg-white px-6 py-24">
      <div className="max-w-2xl mx-auto">
        <a
          href="/"
          className="text-[13px] text-zinc-400 hover:text-zinc-700 transition-colors mb-12 inline-block"
        >
          ← Back
        </a>
        <h1 className="text-[36px] font-bold tracking-tight mb-3">Contact</h1>
        <p className="text-[16px] text-zinc-500 leading-relaxed mb-12">
          Have a question or need help? Send us an email and we'll get back to
          you within 1–2 business days.
        </p>

        <div className="space-y-6">
          <div className="border border-zinc-200 rounded-xl p-6">
            <p className="text-[13px] text-zinc-400 mb-1">Email</p>
            <a
              href="mailto:hello@graphref.org"
              className="text-[15px] font-medium text-zinc-900 hover:text-zinc-500 transition-colors"
            >
              hello@graphref.org
            </a>
          </div>

          <div className="border border-zinc-200 rounded-xl p-6">
            <p className="text-[13px] text-zinc-400 mb-1">Telegram</p>
            <a
              href="https://t.me/graphrefbot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[15px] font-medium text-zinc-900 hover:text-zinc-500 transition-colors"
            >
              @graphrefbot
            </a>
          </div>

          <div className="border border-zinc-200 rounded-xl p-6">
            <p className="text-[13px] text-zinc-400 mb-1">Response time</p>
            <p className="text-[15px] font-medium text-zinc-900">
              1–2 business days
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
