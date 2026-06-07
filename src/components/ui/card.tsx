import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "default" | "muted" | "brand" | "danger";
type Elevation = "flat" | "raised" | "floating";

const tones: Record<Tone, string> = {
  default: "bg-[color:var(--color-surface-raised)] border-[color:var(--color-border)]",
  muted: "bg-[color:var(--color-surface-muted)] border-[color:var(--color-border)]",
  brand: "bg-[color:var(--color-brand-soft)] border-[color:var(--color-brand)]/40",
  danger: "bg-[color:var(--color-danger-soft)] border-[color:var(--color-danger)]/30",
};

const elevations: Record<Elevation, string> = {
  flat: "shadow-none",
  raised: "shadow-[var(--shadow-sm)]",
  floating: "shadow-[var(--shadow-md)]",
};

export function Card({
  tone = "default",
  elevation = "raised",
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  tone?: Tone | undefined;
  elevation?: Elevation | undefined;
}) {
  return (
    <div
      {...rest}
      className={cn("rounded-2xl border", tones[tone], elevations[elevation], className)}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn("border-b border-[color:var(--color-border)] px-5 py-4", className)}
    >
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} className={cn("px-5 py-4", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      {...rest}
      className={cn(
        "text-xs font-bold uppercase tracking-wider text-[color:var(--color-ink-muted)]",
        className,
      )}
    >
      {children}
    </h3>
  );
}
