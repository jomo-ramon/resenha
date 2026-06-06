import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "neutral" | "brand" | "warning" | "info" | "danger" | "captain" | "live" | "muted";

type Size = "xs" | "sm" | "md";

const tones: Record<Tone, string> = {
  neutral:
    "bg-[color:var(--color-surface-muted)] text-[color:var(--color-ink-soft)] border border-[color:var(--color-border)]",
  brand:
    "bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand-ink)] border border-transparent",
  warning:
    "bg-[color:var(--color-warning-soft)] text-[color:var(--color-warning)] border border-transparent",
  info: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-transparent",
  danger:
    "bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger)] border border-transparent",
  captain:
    "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  live: "bg-[color:var(--color-brand)] text-white border border-transparent",
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
    <Badge tone="live" size="sm" className={cn("gap-1.5", className)}>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
      </span>
      AO VIVO
    </Badge>
  );
}
