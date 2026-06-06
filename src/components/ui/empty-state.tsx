import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * EmptyState — friendly illustration + copy + CTA.
 * Reuse anywhere a list/page has no data yet.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-raised)] px-6 py-10 text-center",
        className,
      )}
    >
      {icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand-strong)]">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-base font-bold text-[color:var(--color-ink)]">{title}</h3>
        {description && <p className="text-sm text-[color:var(--color-ink-soft)]">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
