"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Menu, X, ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

type MarketingHeaderProps = {
  activePage?: "about";
  pricingHref?: string;
  theme?: "dark" | "light";
};

const LANGUAGES = [
  { code: "EN", label: "English" },
  { code: "KO", label: "한국어" },
  { code: "JA", label: "日本語" },
  { code: "ZH", label: "中文" },
];

export default function MarketingHeader({
  activePage,
  pricingHref,
  theme = "dark",
}: MarketingHeaderProps) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("EN");
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const isDark = theme === "dark";
  const resolvedPricingHref = pricingHref ?? (pathname === "/" ? "#pricing" : "/#pricing");

  // Close lang dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navClass = isDark
    ? "fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md"
    : "fixed top-0 left-0 right-0 z-50 border-b border-zinc-100 bg-white/80 backdrop-blur-md";
  const brandClass = isDark
    ? "font-mono text-sm tracking-[0.2em] text-white/90 hover:text-white transition"
    : "font-mono text-sm tracking-[0.2em] text-zinc-900 hover:text-zinc-600 transition";
  const linkClass = isDark
    ? "text-sm text-white/40 hover:text-white/70 transition"
    : "text-sm text-zinc-500 hover:text-zinc-900 transition";
  const activeLinkClass = isDark ? "text-sm text-white" : "text-sm text-zinc-900";
  const ctaClass = isDark
    ? "inline-flex items-center gap-2 bg-white text-black text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/90 transition-colors"
    : "inline-flex items-center gap-2 bg-zinc-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors";
  const hamburgerClass = isDark
    ? "text-white/60 hover:text-white transition"
    : "text-zinc-500 hover:text-zinc-900 transition";
  const drawerClass = isDark
    ? "border-t border-white/5 bg-[#0a0a0a]/95 px-4 py-4 flex flex-col gap-4"
    : "border-t border-zinc-100 bg-white/95 px-4 py-4 flex flex-col gap-4";
  const drawerLinkClass = isDark
    ? "text-sm text-white/50 hover:text-white transition py-1"
    : "text-sm text-zinc-500 hover:text-zinc-900 transition py-1";
  const dropdownClass = isDark
    ? "absolute right-0 mt-1.5 w-36 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50"
    : "absolute right-0 mt-1.5 w-36 bg-white border border-zinc-200 rounded-lg shadow-lg overflow-hidden z-50";
  const dropdownItemClass = isDark
    ? "w-full text-left px-3 py-2 text-sm text-white/50 hover:bg-white/5 hover:text-white transition flex items-center justify-between"
    : "w-full text-left px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition flex items-center justify-between";
  const triggerClass = isDark
    ? "flex items-center gap-1 text-xs font-mono text-white/40 hover:text-white/70 transition border border-white/10 hover:border-white/20 rounded px-2 py-1"
    : "flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-zinc-700 transition border border-zinc-200 hover:border-zinc-300 rounded px-2 py-1";

  const LangDropdown = (
    <div ref={langRef} className="relative">
      <button
        onClick={() => setLangOpen(v => !v)}
        className={triggerClass}
        aria-label="Select language"
      >
        {lang}
        <ChevronDown size={11} className={`transition-transform ${langOpen ? "rotate-180" : ""}`} />
      </button>
      {langOpen && (
        <div className={dropdownClass}>
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              className={dropdownItemClass}
              onClick={() => { setLang(l.code); setLangOpen(false); }}
            >
              <span>{l.label}</span>
              <span className="font-mono text-xs opacity-50">{l.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const Logo = (
    <a href="/" className={brandClass}>
      <span className="flex items-center gap-2">
        <svg width="22" height="22" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="14,2 24,8 24,20 14,26 4,20 4,8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.15"/>
          <line x1="14" y1="14" x2="14" y2="2" stroke="currentColor" strokeWidth="1" strokeOpacity="0.25" strokeLinecap="round"/>
          <line x1="14" y1="14" x2="24" y2="20" stroke="currentColor" strokeWidth="1" strokeOpacity="0.25" strokeLinecap="round"/>
          <line x1="14" y1="14" x2="4" y2="20" stroke="currentColor" strokeWidth="1" strokeOpacity="0.25" strokeLinecap="round"/>
          <circle cx="14" cy="2" r="2" fill="currentColor" fillOpacity="0.5"/>
          <circle cx="24" cy="20" r="2" fill="currentColor" fillOpacity="0.35"/>
          <circle cx="4" cy="20" r="2" fill="currentColor" fillOpacity="0.35"/>
          <circle cx="14" cy="14" r="3" fill="currentColor"/>
        </svg>
        <span className="flex items-center">
          <span style={{ opacity: 0.38 }}>GRAP</span>
          <span
            className="inline-block w-[4px] h-[4px] rounded-full mx-[6px] shrink-0 -translate-y-px"
            style={{ background: "currentColor", opacity: 0.5 }}
          />
          <span className="font-bold">HREF</span>
        </span>
      </span>
    </a>
  );

  return (
    <nav className={navClass}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4">
        {Logo}

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <a href="/about" className={activePage === "about" ? activeLinkClass : linkClass}>
            About
          </a>
          <a href={resolvedPricingHref} className={linkClass} onClick={handlePricingClick}>
            Pricing
          </a>
          {LangDropdown}
          <a href="https://t.me/graphrefbot" target="_blank" rel="noopener noreferrer" className={ctaClass}>
            <MessageCircle size={15} />
            Open on Telegram
          </a>
        </div>

        {/* Mobile right: lang + hamburger */}
        <div className="md:hidden flex items-center gap-3">
          {LangDropdown}
          <button
            className={hamburgerClass}
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className={`md:hidden ${drawerClass}`}>
          <a href="/about" className={drawerLinkClass} onClick={() => setOpen(false)}>
            About
          </a>
          <a href={resolvedPricingHref} className={drawerLinkClass} onClick={handlePricingClick}>
            Pricing
          </a>
          <a
            href="https://t.me/graphrefbot"
            target="_blank"
            rel="noopener noreferrer"
            className={ctaClass}
            onClick={() => setOpen(false)}
          >
            <MessageCircle size={15} />
            Open on Telegram
          </a>
        </div>
      )}
    </nav>
  );

  function handlePricingClick(event: React.MouseEvent<HTMLAnchorElement>) {
    const hashIndex = resolvedPricingHref.indexOf("#");
    if (hashIndex === -1) { setOpen(false); return; }
    const targetId = resolvedPricingHref.slice(hashIndex + 1);
    if (!targetId) { setOpen(false); return; }
    event.preventDefault();
    setOpen(false);
    if (pathname === "/") {
      const section = document.getElementById(targetId);
      if (section) {
        window.history.replaceState(null, "", `/#${targetId}`);
        section.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    router.push(`/#${targetId}`, { scroll: false });
  }
}
