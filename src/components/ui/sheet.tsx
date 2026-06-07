"use client";

/**
 * Sheet — mobile bottom-sheet (drag-handle, full-width on mobile,
 * centered modal on md+). Use for player pickers, action menus,
 * confirm dialogs that benefit from thumb reach on mobile.
 *
 * Closes on backdrop click + Escape key. Renders `null` when `open=false`.
 *
 * The implementation is intentionally lightweight (no Radix/portal) so
 * we keep bundle small; if we ever need focus trap + scroll lock we'll
 * upgrade to Radix Dialog.
 */

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

export function Sheet({
  open,
  onClose,
  title,
  children,
  ariaLabelledBy,
}: {
  open: boolean;
  onClose: () => void;
  title?: string | undefined;
  children: ReactNode;
  ariaLabelledBy?: string | undefined;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      className="fixed inset-0 z-40 flex animate-fade items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="w-full max-w-lg animate-sheet rounded-t-3xl border-t border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-raised)] pb-[env(safe-area-inset-bottom)] shadow-[var(--shadow-lg)] sm:rounded-3xl sm:border">
        <SheetHandle />
        {title && (
          <header className="flex items-center justify-between border-b border-[color:var(--color-border)] px-5 py-3">
            <h3 className="text-base font-extrabold tracking-tight">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-[color:var(--color-ink-muted)] hover:bg-[color:var(--color-surface-muted)] hover:text-[color:var(--color-ink)]"
              aria-label="Fechar"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <title>Fechar</title>
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
          </header>
        )}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

/**
 * SheetHandle — visible drag-affordance bar at the top of a bottom sheet.
 * Pure decoration on touch devices; we don't currently wire a real
 * gesture (a single tap on the backdrop already closes).
 */
export function SheetHandle() {
  return (
    <div className="flex justify-center pb-2 pt-2">
      <span
        aria-hidden="true"
        className="block h-1.5 w-12 rounded-full bg-[color:var(--color-border-strong)]"
      />
    </div>
  );
}
