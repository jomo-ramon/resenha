import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();
  const user = session?.user;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 text-center">
        <header className="space-y-3">
          <h1 className="text-5xl font-bold tracking-tight">resenha</h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Organiza a sua pelada sem WhatsApp e sem planilha.
          </p>
        </header>

        {user ? (
          <div className="space-y-4">
            <p className="text-zinc-700 dark:text-zinc-300">
              Olá, <span className="font-medium">{user.name ?? user.email}</span>! 👋
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              A próxima tela (sua lista de peladas) ainda tá em construção.
            </p>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="text-sm text-zinc-500 underline-offset-4 hover:underline dark:text-zinc-400"
              >
                Sair
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/entrar"
            className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-8 text-base font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Entrar
          </Link>
        )}
      </div>
    </main>
  );
}
