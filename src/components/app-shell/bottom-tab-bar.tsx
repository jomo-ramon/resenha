"use client";

/**
 * BottomTabBar — Cartola-style nav bar. 4 tabs with a brand-glow pill
 * around the active item. Only renders inside a pelada (`/p/[slug]/...`)
 * and only on screens < md.
 *
 * The active pill is a wider rounded surface with the brand color text
 * and a soft glow, so the user can tell which tab they're on at a glance
 * even when looking at the screen sideways under fluorescent gym lights.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Tab = {
  label: string;
  href: string;
  icon: ReactNode;
  matches: (pathname: string) => boolean;
};

export function BottomTabBar() {
  const pathname = usePathname();
  const slugMatch = pathname.match(/^\/p\/([^/]+)/);
  if (!slugMatch) return null;
  const peladaSlug = slugMatch[1] ?? "";
  const base = `/p/${peladaSlug}`;

  const tabs: Tab[] = [
    {
      label: "Início",
      href: base,
      icon: <HomeIcon />,
      matches: (p) => p === base,
    },
    {
      label: "Partidas",
      href: `${base}/partidas`,
      icon: <CalendarIcon />,
      matches: (p) =>
        p.startsWith(`${base}/partidas`) ||
        p.startsWith(`${base}/m/`) ||
        p.startsWith(`${base}/nova-partida`),
    },
    {
      label: "Ranking",
      href: `${base}/ranking`,
      icon: <TrophyIcon />,
      matches: (p) => p.startsWith(`${base}/ranking`),
    },
    {
      label: "Perfil",
      href: `${base}/perfil`,
      icon: <UserIcon />,
      matches: (p) => p.startsWith(`${base}/perfil`),
    },
  ];

  return (
    <nav
      aria-label="Navegação principal"
      className="sticky bottom-0 z-30 border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto flex max-w-5xl items-center px-2 py-2">
        {tabs.map((tab) => {
          const active = tab.matches(pathname);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={cn(
                  "group relative flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[10px] font-bold uppercase tracking-wider transition-all",
                  active
                    ? "bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)]"
                    : "text-[color:var(--color-ink-muted)] active:scale-95",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center transition-transform",
                    active && "drop-shadow-[0_0_6px_var(--color-brand-glow)]",
                  )}
                >
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-[color:var(--color-brand)] shadow-[0_0_8px_var(--color-brand-glow)]"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ---------- inline icons (kept tiny, no external set) ---------- */

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Início</title>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Partidas</title>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18" />
      <path d="M8 3v4M16 3v4" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Ranking</title>
      <path d="M7 4h10v5a5 5 0 0 1-10 0Z" />
      <path d="M17 5h3v3a3 3 0 0 1-3 3M7 5H4v3a3 3 0 0 0 3 3" />
      <path d="M9 21h6M10 17h4l-.5 4h-3Z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Perfil</title>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M4 21c1.6-4 4.6-6 8-6s6.4 2 8 6" />
    </svg>
  );
}
