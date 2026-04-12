"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

type BetaModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function BetaModal({ open, onClose }: BetaModalProps) {
  const t = useTranslations("betaModal");
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [testUrl, setTestUrl] = useState("");
  const [searchConsole, setSearchConsole] = useState<"yes" | "no" | "">("");
  const [currentRank, setCurrentRank] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Mount → trigger enter animation on next frame
  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      setTimeout(() => firstInputRef.current?.focus(), 120);
    } else {
      setVisible(false);
      const t = setTimeout(() => {
        setMounted(false);
        setSubmitted(false);
        setName("");
        setEmail("");
        setTestUrl("");
        setSearchConsole("");
        setCurrentRank("");
        setMessage("");
        setConsent(false);
      }, 280);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !testUrl.trim() || !consent) return;
    // TODO: wire up to real backend / email service
    setSubmitted(true);
  }

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-4 overflow-y-auto"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        style={{ opacity: visible ? 1 : 0, transition: "opacity 0.25s ease" }}
        onClick={onClose}
      />

      {/* Modal card */}
      <div
        className="relative w-full max-w-md max-h-[82vh] sm:max-h-[88vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)",
          transition: "opacity 0.28s ease, transform 0.28s cubic-bezier(0.34,1.2,0.64,1)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 transition-colors"
          aria-label={t("closeAria")}
        >
          <X size={18} />
        </button>

        <div className="h-full overflow-y-auto px-6 sm:px-8 pt-6 sm:pt-8 pb-6 sm:pb-8">
          {submitted ? (
            /* Success state */
            <div className="flex flex-col items-center text-center py-6 gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(16,185,129)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p className="text-[17px] font-bold text-zinc-900 mb-1">{t("success.title")}</p>
                <p className="text-[13px] text-zinc-500 leading-relaxed">
                  {t("success.descLine1")}<br />{t("success.descLine2")}
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 text-[13px] font-semibold text-zinc-900 border border-zinc-200 px-5 py-2 rounded-xl hover:bg-zinc-50 transition-colors"
              >
                {t("success.close")}
              </button>
            </div>
          ) : (
            /* Form */
            <>
              <div className="mb-6">
                <h2 className="text-[22px] font-bold text-zinc-900 leading-tight">
                  {t("form.title")}
                </h2>
                <p className="text-[13px] text-zinc-500 mt-1.5 leading-relaxed">
                  {t("form.subtitleLine1")}<br />
                  {t("form.subtitleLine2")}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-zinc-700 mb-1.5">{t("form.nameLabel")}</label>
                  <input
                    ref={firstInputRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("form.namePlaceholder")}
                    required
                    className="w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-[13px] text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-zinc-700 mb-1.5">{t("form.emailLabel")}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hello@example.com"
                    required
                    className="w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-[13px] text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-zinc-700 mb-1.5">{t("form.testUrlLabel")}</label>
                  <input
                    type="url"
                    value={testUrl}
                    onChange={(e) => setTestUrl(e.target.value)}
                    placeholder={t("form.testUrlPlaceholder")}
                    required
                    className="w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-[13px] text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition"
                  />
                </div>

                {/* 서치 콘솔 등록 여부 */}
                <div>
                  <p className="text-[12px] font-medium text-zinc-700 mb-2">
                    {t("form.searchConsoleQuestion")}
                  </p>
                  <div className="flex gap-3">
                    {(["yes", "no"] as const).map((val) => (
                      <label
                        key={val}
                        className={`flex-1 flex items-center justify-center gap-2 border rounded-xl py-2.5 cursor-pointer text-[13px] font-medium transition-colors ${
                          searchConsole === val
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                        }`}
                      >
                        <input
                          type="radio"
                          name="searchConsole"
                          value={val}
                          checked={searchConsole === val}
                          onChange={() => setSearchConsole(val)}
                          className="sr-only"
                        />
                        {val === "yes" ? t("form.searchConsoleYes") : t("form.searchConsoleNo")}
                      </label>
                    ))}
                  </div>
                </div>

                {/* 현재 순위 */}
                <div>
                  <label className="block text-[12px] font-medium text-zinc-700 mb-1.5">
                    {t("form.currentRankLabel")}
                    <span className="text-zinc-400 font-normal ml-1">({t("form.currentRankHint")})</span>
                  </label>
                  <input
                    type="text"
                    value={currentRank}
                    onChange={(e) => setCurrentRank(e.target.value)}
                    placeholder={t("form.currentRankPlaceholder")}
                    className="w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-[13px] text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-zinc-700 mb-1.5">
                    {t("form.messageLabel")} <span className="text-zinc-400 font-normal">({t("form.optional")})</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t("form.messagePlaceholder")}
                    rows={2}
                    className="w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-[13px] text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition resize-none"
                  />
                </div>

                <label className="flex items-start gap-2.5 rounded-xl border border-zinc-200 px-3.5 py-3">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    required
                    className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900/20"
                  />
                  <span className="text-[12px] text-zinc-600 leading-relaxed">
                    {t("form.consentLine1")}
                    <span className="block text-zinc-500 mt-0.5">
                      {t("form.consentLine2")}
                    </span>
                  </span>
                </label>

                <button
                  type="submit"
                  className="w-full bg-zinc-900 text-white text-[14px] font-semibold py-3 rounded-xl hover:bg-zinc-700 transition-colors mt-1"
                >
                  {t("form.submit")}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
