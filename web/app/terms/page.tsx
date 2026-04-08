export default function Terms() {
  return (
    <main className="min-h-screen bg-white px-6 py-24">
      <div className="max-w-2xl mx-auto">
        <a
          href="/"
          className="text-[13px] text-zinc-400 hover:text-zinc-700 transition-colors mb-12 inline-block"
        >
          ← Back
        </a>
        <h1 className="text-[36px] font-bold tracking-tight mb-2">
          Terms of Service
        </h1>
        <p className="text-[13px] text-zinc-400 mb-12">
          Last updated: April 2026
        </p>

        <div className="prose prose-zinc max-w-none text-[15px] leading-relaxed space-y-8">
          <section>
            <h2 className="text-[18px] font-semibold text-zinc-900 mb-3">
              1. Service
            </h2>
            <p className="text-zinc-500">
              Graphref provides a Telegram-based service that generates search
              traffic to URLs specified by the user. By using Graphref, you
              agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-zinc-900 mb-3">
              2. Credits
            </h2>
            <p className="text-zinc-500">
              Credits are purchased on a one-time basis and do not expire. Each
              task consumes 10 credits. Credits are non-refundable except in
              cases where a job fails to complete, in which case credits are
              automatically returned.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-zinc-900 mb-3">
              3. Acceptable Use
            </h2>
            <p className="text-zinc-500">
              You may only use Graphref to generate traffic to domains you own
              or have explicit permission to promote. You may not use Graphref
              to target third-party sites without authorization, conduct
              fraudulent activity, or violate any applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-zinc-900 mb-3">
              4. Disclaimer
            </h2>
            <p className="text-zinc-500">
              Graphref does not guarantee specific ranking improvements or
              search engine outcomes. Results vary based on domain, keyword
              competition, and search engine algorithms. Use at your own
              discretion.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-zinc-900 mb-3">
              5. Termination
            </h2>
            <p className="text-zinc-500">
              We reserve the right to suspend or terminate access to any user
              who violates these terms without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-zinc-900 mb-3">
              6. Contact
            </h2>
            <p className="text-zinc-500">
              For any questions regarding these terms, contact us at{" "}
              <a
                href="mailto:hello@graphref.org"
                className="text-zinc-900 underline"
              >
                hello@graphref.org
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
