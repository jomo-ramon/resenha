import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/entrar");
  }

  const user = session.user;
  const displayName = user.name?.split(" ")[0] ?? user.email ?? "você";

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/peladas" className="text-xl font-bold tracking-tight">
            resenha
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-zinc-600 sm:inline dark:text-zinc-400">
              Olá,{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{displayName}</span>
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="text-sm text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8">{children}</div>
      </main>
    </div>
  );
}
