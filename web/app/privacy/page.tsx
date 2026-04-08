export default function Privacy() {
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
          Privacy Policy
        </h1>
        <p className="text-[13px] text-zinc-400 mb-12">
          Last updated: April 2026
        </p>

        <div className="prose prose-zinc max-w-none text-[15px] leading-relaxed space-y-8">
          <section>
            <h2 className="text-[18px] font-semibold text-zinc-900 mb-3">
              1. What we collect
            </h2>
            <p className="text-zinc-500">
              We collect your Telegram chat ID when you start the bot. We also
              store the keywords and domains you submit as part of running jobs,
              along with your credit balance and transaction history.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-zinc-900 mb-3">
              2. How we use it
            </h2>
            <p className="text-zinc-500">
              Your data is used solely to operate the service — processing jobs,
              managing credits, and sending job status notifications via
              Telegram. We do not sell or share your data with third parties.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-zinc-900 mb-3">
              3. Payment data
            </h2>
            <p className="text-zinc-500">
              Payments are processed through Telegram Stars and Lemon Squeezy.
              We do not store card numbers or payment credentials. Please refer
              to their respective privacy policies for details.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-zinc-900 mb-3">
              4. Data retention
            </h2>
            <p className="text-zinc-500">
              Job data is retained for 30 days after completion. Credit balance
              and account data are retained for as long as your account is
              active.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-zinc-900 mb-3">
              5. Your rights
            </h2>
            <p className="text-zinc-500">
              You can request deletion of your data at any time by contacting
              us. We will remove your account and associated data within 7
              business days.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-zinc-900 mb-3">
              6. Contact
            </h2>
            <p className="text-zinc-500">
              Questions about this policy? Reach us at{" "}
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
