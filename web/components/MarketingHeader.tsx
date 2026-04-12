"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Menu, X, ChevronDown } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

type MarketingHeaderProps = {
  activePage?: "about" | "features" | "changelog";
  pricingHref?: string;
  theme?: "dark" | "light";
};

const LANGUAGES = [
  { code: "en", label: "English", display: "EN" },
  { code: "ko", label: "한국어", display: "KO" },
  { code: "ru", label: "Русский", display: "RU" },
  { code: "es", label: "Español", display: "ES" },
];

export default function MarketingHeader({
  activePage,
  pricingHref,
  theme = "dark",
}: MarketingHeaderProps) {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const desktopLangRef = useRef<HTMLDivElement>(null);
  const mobileLangRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");
  const isDark = theme === "dark";

  // useLocale() returns current locale ("en"|"ko"|"ru"|"es")
  // usePathname() from next-intl returns path WITHOUT locale prefix (e.g. "/about")
  const locale = useLocale();
  const currentLang = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  // prefix for building hrefs in <a> tags (en has no prefix)
  const prefix = locale === "en" ? "" : `/${locale}`;

  const resolvedPricingHref = pricingHref ?? (pathname === "/" ? "#pricing" : "/#pricing");

  // Close lang dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideDesktop = desktopLangRef.current?.contains(target);
      const insideMobile = mobileLangRef.current?.contains(target);

      if (!insideDesktop && !insideMobile) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function switchLocale(targetLocale: string) {
    setLangOpen(false);
    const next = `${pathname || "/"}${window.location.search}${window.location.hash}`;
    document.cookie = `NEXT_LOCALE=${targetLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.replace(next, { locale: targetLocale });
  }

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

  const aboutHref = `${prefix}/about`;
  const pricingHrefResolved = pricingHref
    ? `${prefix}${pricingHref}`
    : resolvedPricingHref.startsWith("#")
      ? resolvedPricingHref
      : `${prefix}${resolvedPricingHref}`;

  function renderLangDropdown(ref: React.RefObject<HTMLDivElement | null>) {
    return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setLangOpen(v => !v)}
        className={triggerClass}
        aria-label="Select language"
      >
        {currentLang.display}
        <ChevronDown size={11} className={`transition-transform ${langOpen ? "rotate-180" : ""}`} />
      </button>
      {langOpen && (
        <div className={dropdownClass}>
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              className={dropdownItemClass}
              onClick={() => switchLocale(l.code)}
            >
              <span>{l.label}</span>
              <span className="font-mono text-xs opacity-50">{l.display}</span>
            </button>
          ))}
        </div>
      )}
    </div>
    );
  }

  const Logo = (
    <a href={prefix || "/"} className={brandClass}>
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
          <a href={`${prefix}/features`} className={activePage === "features" ? activeLinkClass : linkClass}>
            {t("features")}
          </a>
          <a href={aboutHref} className={activePage === "about" ? activeLinkClass : linkClass}>
            {t("about")}
          </a>
          <a href={`${prefix}/changelog`} className={activePage === "changelog" ? activeLinkClass : linkClass}>
            {t("changelog")}
          </a>
          <a href={pricingHrefResolved} className={linkClass} onClick={handlePricingClick}>
            {t("pricing")}
          </a>
          {renderLangDropdown(desktopLangRef)}
          <a href="https://t.me/graphrefbot" target="_blank" rel="noopener noreferrer" className={ctaClass}>
            <MessageCircle size={15} />
            {t("openTelegram")}
          </a>
        </div>

        {/* Mobile right: lang + hamburger */}
        <div className="md:hidden flex items-center gap-3">
          {renderLangDropdown(mobileLangRef)}
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
          <a href={`${prefix}/features`} className={activePage === "features" ? activeLinkClass : drawerLinkClass} onClick={() => setOpen(false)}>
            {t("features")}
          </a>
          <a href={aboutHref} className={activePage === "about" ? activeLinkClass : drawerLinkClass} onClick={() => setOpen(false)}>
            {t("about")}
          </a>
          <a href={`${prefix}/changelog`} className={activePage === "changelog" ? activeLinkClass : drawerLinkClass} onClick={() => setOpen(false)}>
            {t("changelog")}
          </a>
          <a href={pricingHrefResolved} className={drawerLinkClass} onClick={handlePricingClick}>
            {t("pricing")}
          </a>
          <a
            href="https://t.me/graphrefbot"
            target="_blank"
            rel="noopener noreferrer"
            className={ctaClass}
            onClick={() => setOpen(false)}
          >
            <MessageCircle size={15} />
            {t("openTelegram")}
          </a>
        </div>
      )}
    </nav>
  );

  function handlePricingClick(event: React.MouseEvent<HTMLAnchorElement>) {
    const href = pricingHrefResolved;
    const hashIndex = href.indexOf("#");
    if (hashIndex === -1) { setOpen(false); return; }
    const targetId = href.slice(hashIndex + 1);
    if (!targetId) { setOpen(false); return; }
    event.preventDefault();
    setOpen(false);

    // pathname from next-intl has no locale prefix — "/" means home in any locale
    if (pathname === "/") {
      const section = document.getElementById(targetId);
      if (section) {
        window.history.replaceState(null, "", `${prefix}/#${targetId}`);
        section.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    router.push(`/#${targetId}`, { scroll: false });
  }
}
