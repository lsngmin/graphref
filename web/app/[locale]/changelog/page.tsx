import Header from "@/components/Header";
import ChangelogClient from "./ChangelogClient";

export const metadata = {
  title: "Changelog — Graphref",
  description: "What's new in Graphref — updates, fixes, and improvements to the bot.",
  openGraph: {
    title: "Changelog — Graphref",
    description: "What's new in Graphref — updates, fixes, and improvements to the bot.",
    url: "https://graphref.com/changelog",
  },
};

export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header activePage="changelog" theme="light" />

      <section className="pt-28 pb-12 px-6 border-b border-zinc-100">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-[32px] font-bold tracking-tight text-zinc-900 mb-3">Changelog</h1>
          <p className="text-[15px] text-zinc-500 leading-relaxed">
            Updates, fixes, and improvements to the Graphref bot — newest first.
          </p>
        </div>
      </section>

      <ChangelogClient />

      <footer className="border-t border-zinc-100 py-8 px-6">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-zinc-400">
          <span>© {new Date().getFullYear()} Graphref</span>
          <div className="flex gap-5">
            <a href="/features" className="hover:text-zinc-700 transition-colors">Features</a>
            <a href="/about" className="hover:text-zinc-700 transition-colors">About</a>
            <a href="/contact" className="hover:text-zinc-700 transition-colors">Contact</a>
            <a href="/terms" className="hover:text-zinc-700 transition-colors">Terms</a>
            <a href="/privacy" className="hover:text-zinc-700 transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
