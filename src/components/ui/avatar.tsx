import { cn } from "@/lib/utils/cn";

/**
 * Avatar — circular initials chip with optional neon ring.
 *
 * Default style is a soft surface with the user's initial; pass
 * `tone="brand"` for the brand-green chip (used for "the current user"
 * or "captain"), or `tone="team-light"|"team-dark"` for team rosters.
 */

type Tone = "default" | "brand" | "accent" | "team-light" | "team-dark";
type Size = "xs" | "sm" | "md" | "lg" | "xl";

const sizes: Record<Size, { box: string; text: string }> = {
  xs: { box: "h-6 w-6 text-[10px]", text: "text-[10px]" },
  sm: { box: "h-8 w-8 text-xs", text: "text-xs" },
  md: { box: "h-10 w-10 text-sm", text: "text-sm" },
  lg: { box: "h-12 w-12 text-base", text: "text-base" },
  xl: { box: "h-16 w-16 text-xl", text: "text-xl" },
};

const tones: Record<Tone, string> = {
  default:
    "bg-[color:var(--color-surface-overlay)] text-[color:var(--color-ink-soft)] ring-1 ring-[color:var(--color-border)]",
  brand:
    "bg-[color:var(--color-brand)] text-[color:var(--color-brand-ink)] ring-2 ring-[color:var(--color-brand-glow)] shadow-[var(--shadow-brand)]",
  accent:
    "bg-[color:var(--color-accent)] text-[color:var(--color-accent-ink)] ring-2 ring-[color:var(--color-accent)]/40",
  "team-light":
    "bg-[color:var(--color-team-light)] text-[color:var(--color-team-light-ink)] ring-1 ring-[color:var(--color-border-strong)]",
  "team-dark":
    "bg-[color:var(--color-team-dark)] text-[color:var(--color-team-dark-ink)] ring-1 ring-[color:var(--color-border-strong)]",
};

export function Avatar({
  name,
  size = "md",
  tone = "default",
  shirtNumber,
  className,
}: {
  name: string;
  size?: Size;
  tone?: Tone;
  shirtNumber?: number | null;
  className?: string;
}) {
  const initial = (
    shirtNumber !== undefined && shirtNumber !== null ? String(shirtNumber) : initialsFrom(name)
  ).slice(0, 2);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-extrabold tabular-nums",
        sizes[size].box,
        tones[tone],
        className,
      )}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

function initialsFrom(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return (parts[0] ?? "?").slice(0, 1).toUpperCase();
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return (first + last).toUpperCase();
}
