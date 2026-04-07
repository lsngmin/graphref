"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavIconType = "store" | "grid" | "users" | "folder" | "file";

function NavIcon({ icon }: { icon: NavIconType }) {
  if (icon === "grid") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-3 w-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    );
  }

  if (icon === "store") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-3 w-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9h18" />
        <path d="M4 9l2-5h12l2 5" />
        <path d="M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9" />
        <path d="M9 21v-7h6v7" />
      </svg>
    );
  }

  if (icon === "users") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-3 w-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />
        <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />
        <path d="M2 21a6 6 0 0 1 12 0" />
        <path d="M14 21a6 6 0 0 1 8 0" />
      </svg>
    );
  }

  if (icon === "folder") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-3 w-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
        <path d="M3 7v-1a2 2 0 0 1 2-2h4l2 2" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

const navLinks = [
  { label: "Overview", href: "/", icon: "store" as const },
  { label: "Pricing", href: "/pricing", icon: "grid" as const },
  { label: "Dashboard", href: "/dashboard", icon: "users" as const },
  { label: "Schedules", href: "/dashboard", icon: "folder" as const },
  { label: "Jobs", href: "/dashboard", icon: "file" as const },
];

export default function Topbar() {
  const pathname = usePathname();

  return (
    <header className="fixed left-0 right-0 top-0 z-20 flex h-12 w-full items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3">
      <Link href="/" className="text-lg font-semibold text-zinc-800">
        GRAP<span className="font-medium text-zinc-500">HREF</span>
      </Link>

      <div className="flex items-center gap-2">
        <nav className="flex items-center gap-1" aria-label="Primary">
          {navLinks.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex h-6 items-center gap-1 rounded-md px-2 text-xs font-medium leading-none transition",
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-700 hover:text-zinc-900",
                ].join(" ")}
              >
                <NavIcon icon={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="h-5 w-px bg-zinc-200" aria-hidden="true" />

        <div className="flex items-center gap-1">
          <Link
            href="/pricing"
            className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-600 transition hover:text-zinc-900"
            aria-label="Pricing"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 1v22" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </Link>
          <Link
            href="/dashboard"
            className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-600 transition hover:text-zinc-900"
            aria-label="Dashboard"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 13h8V3H3z" />
              <path d="M13 21h8v-8h-8z" />
              <path d="M13 3h8v8h-8z" />
              <path d="M3 21h8v-4H3z" />
            </svg>
          </Link>
          <Link
            href="/dashboard"
            className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-600 transition hover:text-zinc-900"
            aria-label="Telegram login"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 2 11 13" />
              <path d="m22 2-7 20-4-9-9-4Z" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
