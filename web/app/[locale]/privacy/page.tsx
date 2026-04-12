import { useTranslations } from "next-intl";
import Header from "@/components/Header";

export const metadata = {
  title: "Privacy Policy — Graphref",
  description: "How Graphref collects, uses, and protects your personal information.",
  openGraph: {
    title: "Privacy Policy — Graphref",
    description: "How Graphref collects, uses, and protects your personal information.",
    url: "https://graphref.com/privacy",
  },
};

export default function Privacy() {
  const t = useTranslations();

  return (
    <main className="min-h-screen bg-white">
      <Header theme="light" />
      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <h1 className="text-[32px] font-bold tracking-tight mb-2">
          {t("privacy.title")}
        </h1>
        <p className="text-[13px] text-zinc-400 mb-6">
          {t("privacy.updated")}
        </p>
        <p className="text-[15px] text-zinc-500 leading-relaxed mb-12">
          {t("privacy.intro")}
        </p>

        <div className="prose prose-zinc max-w-none text-[15px] leading-relaxed space-y-10">
          <section>
            <h2 className="text-[18px] font-semibold text-zinc-900 mb-3">
              1. Scope and controller
            </h2>
            <p className="text-zinc-500">
              This Policy applies to Graphref-operated touchpoints, including
              the website, the Telegram bot, purchase and credit flows, and
              support communications. For the personal information described in
              this Policy, Graphref acts as the controller or business
              responsible for deciding why and how that information is
              processed.
            </p>
            <p className="text-zinc-500">
              Questions, requests, or complaints can be sent to{" "}
              <a
                href="mailto:support@graphref.org"
                className="text-zinc-900 underline"
              >
                support@graphref.org
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-zinc-900 mb-3">
              2. Categories of personal information we collect
            </h2>
            <p className="text-zinc-500">
              Depending on how you interact with Graphref, we may collect the
              following categories of personal information:
            </p>
            <ul className="list-disc pl-6 text-zinc-500 space-y-2">
              <li>
                <strong className="text-zinc-900">Telegram identity data:</strong>{" "}
                Telegram user ID or chat ID, username, display name, and other
                Telegram account fields made available to us through the bot or
                Telegram login flow.
              </li>
              <li>
                <strong className="text-zinc-900">Authentication data:</strong>{" "}
                Telegram login payload fields required to verify that a login
                request is genuine, together with website authentication state
                stored in cookies such as `tg_auth` and `tg_user`.
              </li>
              <li>
                <strong className="text-zinc-900">Service input data:</strong>{" "}
                keywords, domains, URLs, job instructions, and related command
                content you submit to run the service.
              </li>
              <li>
                <strong className="text-zinc-900">Account and usage data:</strong>{" "}
                credit balance, purchased plans, refund events, job history, job
                status, timestamps, and support history.
              </li>
              <li>
                <strong className="text-zinc-900">Transaction data:</strong>{" "}
                checkout identifiers, plan selections, provider transaction
                references, payment status, and limited billing metadata made
                available to us by payment providers. We do not store full card
                numbers or full payment credentials.
              </li>
              <li>
                <strong className="text-zinc-900">Technical and device data:</strong>{" "}
                IP address, browser type, operating system, user agent, request
                timestamps, referrer data, and similar server or security log
                data generated when you use the website or APIs.
              </li>
              <li>
                <strong className="text-zinc-900">Support communications:</strong>{" "}
                the contents of emails, Telegram messages, and any files or
                screenshots you send to us for support or dispute resolution.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-zinc-900 mb-3">
              3. How we collect information
            </h2>
            <ul className="list-disc pl-6 text-zinc-500 space-y-2">
              <li>
                Directly from you when you message the bot, submit keywords or
                domains, purchase credits, or contact support.
              </li>
              <li>
                From Telegram when you authenticate through the Telegram login
                widget or interact with the Graphref bot.
              </li>
              <li>
                From payment providers, including PayPal and Telegram payment
                features such as Telegram Stars, when they notify us of
                purchase status, checkout identifiers, or refunds.
              </li>
              <li>
                Automatically from your device and browser through essential
                cookies, request metadata, and normal server-side logging.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-zinc-900 mb-3">
              4. Purposes of processing and legal bases
            </h2>
            <p className="text-zinc-500">
              We process personal information only for legitimate business and
              operational purposes related to Graphref. Where GDPR, UK GDPR, or
              similar laws apply, we generally rely on one or more of the
              following legal bases:
            </p>
            <ul className="list-disc pl-6 text-zinc-500 space-y-2">
              <li>
                <strong className="text-zinc-900">
                  Performance of a contract:
                </strong>{" "}
                to authenticate users, run requested jobs, maintain credits,
                process purchases, issue refunds, and provide the service you
                asked us to provide.
              </li>
              <li>
                <strong className="text-zinc-900">Legitimate interests:</strong>{" "}
                to secure the service, prevent fraud or abuse, debug and
                maintain the product, enforce our Terms, communicate about
                service status, and respond to support requests in a way users
                reasonably expect.
              </li>
              <li>
                <strong className="text-zinc-900">Legal obligation:</strong>{" "}
                to comply with applicable accounting, tax, law-enforcement, or
                regulatory obligations.
              </li>
              <li>
                <strong className="text-zinc-900">Consent:</strong> where a
                specific use of personal information legally requires consent,
                we will rely on consent and allow withdrawal where required by
                law.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-zinc-900 mb-3">
              5. Cookies, local storage, and similar technologies
            </h2>
            <p className="text-zinc-500">
              Graphref uses essential cookies needed to operate the web
              experience. Our current website authentication flow stores
              server-set cookies such as `tg_auth` and `tg_user` to remember
              Telegram connection state and identify the connected account in
              the dashboard.
            </p>
            <p className="text-zinc-500">
              We also load the Telegram login widget from Telegram&apos;s
              servers when you choose to connect your Telegram account. That
              third-party widget may independently collect device, network, or
              cookie information subject to Telegram&apos;s own privacy terms.
              If you disable essential cookies, some parts of the Service may
              not function properly.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-zinc-900 mb-3">
              6. Disclosures to third parties
            </h2>
            <p className="text-zinc-500">
              We do not sell personal information. We do not disclose personal
              information to third parties except as reasonably necessary to
              operate the Service, comply with law, or protect our rights.
            </p>
            <ul className="list-disc pl-6 text-zinc-500 space-y-2">
              <li>
                <strong className="text-zinc-900">Telegram:</strong> for bot
                messaging, user authentication, and Telegram-native payment
                flows.
              </li>
              <li>
                <strong className="text-zinc-900">PayPal:</strong> for hosted
                checkout, payment processing, transaction reporting, and refund
                administration.
              </li>
              <li>
                <strong className="text-zinc-900">
                  Hosting and infrastructure providers:
                </strong>{" "}
                for website delivery, storage, security, and service
                operations, to the extent needed to host or support Graphref.
              </li>
              <li>
                <strong className="text-zinc-900">
                  Professional advisers and authorities:
                </strong>{" "}
                where disclosure is reasonably necessary for legal compliance,
                dispute handling, fraud prevention, or protection of Graphref,
                users, or the public.
              </li>
              <li>
                <strong className="text-zinc-900">
                  Corporate transactions:
                </strong>{" "}
                if Graphref is involved in a merger, acquisition, financing,
                asset sale, or business restructuring, personal information may
                be disclosed as part of that transaction subject to applicable
                confidentiality and legal safeguards.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-zinc-900 mb-3">
              7. International transfers
            </h2>
            <p className="text-zinc-500">
              Graphref operates online and may use service providers that
              process data in multiple countries. Telegram, PayPal, and
              infrastructure providers may process information outside your
              home jurisdiction. Where required by applicable law, we will take
              reasonable steps to use legally recognized transfer mechanisms or
              comparable safeguards for cross-border transfers.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-zinc-900 mb-3">
              8. Data retention
            </h2>
            <p className="text-zinc-500">
              We keep personal information only for as long as reasonably
              necessary for the purposes described in this Policy, unless a
              longer retention period is required or permitted by law.
            </p>
            <ul className="list-disc pl-6 text-zinc-500 space-y-2">
              <li>
                Website authentication cookies are generally retained for the
                browser session unless cleared earlier.
              </li>
              <li>
                Job instructions, keywords, domains, and job-status data are
                ordinarily retained while a job is active and for up to 30 days
                after completion, except where longer retention is reasonably
                necessary for fraud review, abuse prevention, dispute handling,
                backups, or legal compliance.
              </li>
              <li>
                Credit, transaction, refund, and account records may be kept
                for as long as the account remains active and thereafter for a
                reasonable period needed to maintain accurate financial records,
                resolve disputes, enforce our Terms, and comply with legal
                obligations.
              </li>
              <li>
                Support communications may be retained for as long as needed to
                respond to the request, maintain an accurate support history,
                and protect against repeat abuse or fraud.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-zinc-900 mb-3">
              9. Security measures
            </h2>
            <p className="text-zinc-500">
              We use reasonable technical, administrative, and organizational
              measures designed to protect personal information against
              unauthorized access, loss, misuse, or alteration. These measures
              may include server-side verification of Telegram login payloads,
              HTTP-only authentication cookies on the website, access
              restrictions, and operational monitoring for abuse or fraudulent
              activity.
            </p>
            <p className="text-zinc-500">
              No internet-based system is completely secure. We therefore cannot
              guarantee absolute security, and you use the Service at your own
              risk.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-zinc-900 mb-3">
              10. Your rights and choices
            </h2>
            <p className="text-zinc-500">
              Depending on your location and applicable law, you may have the
              right to request access to personal information we hold about you,
              request correction or deletion, object to certain processing,
              request restriction of processing, request portability, withdraw
              consent where consent is the legal basis, or complain to a data
              protection regulator.
            </p>
            <p className="text-zinc-500">
              To exercise these rights, contact{" "}
              <a
                href="mailto:support@graphref.org"
                className="text-zinc-900 underline"
              >
                support@graphref.org
              </a>
              . We may need to verify your identity before acting on a request.
              We may also retain limited information where required to complete
              a transaction, detect fraud, resolve disputes, comply with law, or
              enforce our agreements.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-zinc-900 mb-3">
              11. Sale of data, advertising, and automated decision-making
            </h2>
            <p className="text-zinc-500">
              Graphref does not sell personal information for money. We do not
              use the Service to run third-party behavioral advertising, and we
              do not make solely automated decisions that produce legal or
              similarly significant effects about users.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-zinc-900 mb-3">
              12. Children&apos;s privacy
            </h2>
            <p className="text-zinc-500">
              Graphref is not directed to children, and we do not knowingly
              collect personal information from children in violation of
              applicable law. If you believe a child has provided personal
              information to us, contact us and we will review and delete the
              information where required.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-zinc-900 mb-3">
              13. Changes to this Policy
            </h2>
            <p className="text-zinc-500">
              We may update this Privacy Policy from time to time to reflect
              changes to the Service, legal requirements, security practices, or
              operational needs. When we make material changes, we will update
              the &quot;Last updated&quot; date and may provide additional notice
              where required by law.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-semibold text-zinc-900 mb-3">
              14. Contact
            </h2>
            <p className="text-zinc-500">
              For privacy-related questions or requests, contact{" "}
              <a
                href="mailto:support@graphref.org"
                className="text-zinc-900 underline"
              >
                support@graphref.org
              </a>{" "}
              or reach us through{" "}
              <a
                href="https://t.me/graphrefbot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-900 underline"
              >
                @graphrefbot
              </a>
              .
            </p>
          </section>
        </div>
      </div>

      <footer className="border-t border-zinc-100 py-8 px-6">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-zinc-400">
          <span>© {new Date().getFullYear()} Graphref</span>
          <div className="flex gap-5">
            <a href="/features" className="hover:text-zinc-700 transition-colors">Features</a>
            <a href="/about" className="hover:text-zinc-700 transition-colors">About</a>
            <a href="/contact" className="hover:text-zinc-700 transition-colors">Contact</a>
            <a href="/terms" className="hover:text-zinc-700 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
