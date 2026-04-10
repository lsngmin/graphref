import type { Metadata } from "next";
import { DM_Sans, Space_Mono, Noto_Sans_KR, Noto_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import HashScrollHandler from "@/components/HashScrollHandler";
import "../globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-sans-kr",
});

// Cyrillic support for Russian
const notoSans = Noto_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-sans-cyr",
});

export const metadata: Metadata = {
  title: "GrapHref",
  description: "Traffic orchestration & web intelligence pipeline.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default async function LocaleLayout({
  children,
  modal,
  params,
}: {
  children: React.ReactNode;
  modal?: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  const localeFontClass =
    locale === "ko" ? "font-sans-kr"
    : locale === "ru" ? "font-sans-cyr"
    : "";

  return (
    <html lang={locale}>
      <body
        className={`${dmSans.variable} ${spaceMono.variable} ${notoSansKr.variable} ${notoSans.variable} antialiased ${localeFontClass}`}
      >
        <NextIntlClientProvider messages={messages}>
          <HashScrollHandler />
          {children}
          {modal}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
