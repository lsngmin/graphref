import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GrapHref",
  description: "Traffic orchestration & web intelligence pipeline.",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal?: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        {modal}
      </body>
    </html>
  );
}
