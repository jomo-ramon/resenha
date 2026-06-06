import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Field — label + control + (hint | error) bundle.
 * Pass any input/select as children.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string | undefined;
  error?: string | undefined;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-semibold text-[color:var(--color-ink)]"
      >
        {label}
        {required && <span className="ml-0.5 text-[color:var(--color-danger)]">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-[color:var(--color-danger)]">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[color:var(--color-ink-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "block h-11 w-full rounded-xl border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-raised)] px-3.5 text-base text-[color:var(--color-ink)] placeholder-[color:var(--color-ink-muted)] transition-colors focus-visible:border-[color:var(--color-brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand)]/30";
