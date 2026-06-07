import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/ui";
import { signOut } from "@/lib/auth";
import { cn } from "@/lib/utils/cn";

/**
 * AppHeader — sticky, opaque-dark, brand-glow logo.
 * Avatar is a small chip; "sair" lives in a soft outlined pill.
 */
export function AppHeader({
  displayName,
  avatarUrl,
}: {
  displayName: string;
  avatarUrl?: string | null;
}) {
  const initials = displayName.slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Link
          href="/peladas"
          className="flex items-center text-[color:var(--color-brand)] drop-shadow-[0_0_8px_var(--color-brand-glow)] transition-transform active:scale-95"
        >
          <Logo size="md" />
        </Link>

        <div className="flex items-center gap-2.5">
          <span
            className="hidden text-xs font-semibold uppercase tracking-wider text-[color:var(--color-ink-soft)] sm:inline"
            title={displayName}
          >
            {displayName}
          </span>
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[color:var(--color-brand)] text-sm font-extrabold text-[color:var(--color-brand-ink)] ring-2 ring-[color:var(--color-brand-glow)]",
              avatarUrl && "bg-transparent",
            )}
            title={`Conectado como ${displayName}`}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                width={36}
                height={36}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              initials
            )}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="rounded-full border border-[color:var(--color-border-strong)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[color:var(--color-ink-muted)] transition-colors hover:border-[color:var(--color-danger)]/40 hover:text-[color:var(--color-danger)]"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
