import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "neutral" | "brand" | "warning" | "info" | "danger" | "captain" | "live" | "muted";

type Size = "xs" | "sm" | "md";

const tones: Record<Tone, string> = {
  neutral:
    "bg-[color:var(--color-surface-overlay)] text-[color:var(--color-ink-soft)] border border-[color:var(--color-border)]",
  brand:
    "bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand)] border border-[color:var(--color-brand)]/30",
  warning:
    "bg-[color:var(--color-warning-soft)] text-[color:var(--color-warning)] border border-[color:var(--color-warning)]/30",
  info: "bg-[color:var(--color-info-soft)] text-[color:var(--color-info)] border border-[color:var(--color-info)]/30",
  danger:
    "bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger)] border border-[color:var(--color-danger)]/30",
  captain:
    "bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)] border border-[color:var(--color-accent)]/30",
  live: "bg-[color:var(--color-brand)] text-[color:var(--color-brand-ink)] border border-transparent shadow-[var(--shadow-brand)]",
  muted:
    "bg-transparent text-[color:var(--color-ink-muted)] border border-[color:var(--color-border)]",
};

const sizes: Record<Size, string> = {
  xs: "px-1.5 py-0.5 text-[10px] uppercase tracking-wider",
  sm: "px-2.5 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
};

export function Badge({
  tone = "neutral",
  size = "sm",
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone | undefined; size?: Size | undefined }) {
  return (
    <span
      {...rest}
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold",
        tones[tone],
        sizes[size],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * LiveBadge — animated pulse for "in progress" matches.
 */
export function LiveBadge({ className }: { className?: string }) {
  return (
    <Badge tone="live" size="sm" className={cn("gap-1.5 uppercase tracking-wider", className)}>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--color-brand-ink)] opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--color-brand-ink)]" />
      </span>
      Ao vivo
    </Badge>
  );
}
