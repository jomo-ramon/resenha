import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/ui";
import { signOut } from "@/lib/auth";
import { cn } from "@/lib/utils/cn";

/**
 * AppHeader — sticky compact header for authenticated routes.
 *
 * On mobile it's the only nav (the BottomTabBar handles navigation).
 * On desktop it pairs with the sidebar.
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
    <header className="sticky top-0 z-20 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)]/85 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--color-surface)]/75">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Link href="/peladas" className="flex items-center text-[color:var(--color-ink)]">
          <Logo size="md" className="text-[color:var(--color-brand)]" />
        </Link>

        <div className="flex items-center gap-3">
          <span
            className="hidden text-sm text-[color:var(--color-ink-soft)] sm:inline"
            title={displayName}
          >
            {displayName}
          </span>
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[color:var(--color-brand)] text-sm font-bold text-white",
              avatarUrl && "bg-transparent",
            )}
            title={`Perfil de ${displayName}`}
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
              className="text-xs text-[color:var(--color-ink-muted)] underline-offset-4 hover:text-[color:var(--color-ink)] hover:underline"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
