import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Entrar — resenha",
};

type SearchParams = Promise<{ error?: string; callbackUrl?: string }>;

const errorMessages: Record<string, string> = {
  Configuration: "Configuração de login indisponível. Tenta de novo em alguns minutos.",
  AccessDenied: "Acesso negado. Entra em contato com o admin da pelada.",
  Verification: "O link expirou ou já foi usado. Pede outro.",
  Default: "Algo deu errado no login. Tenta de novo.",
};

export default async function EntrarPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  const { error, callbackUrl } = await searchParams;

  if (session?.user) {
    redirect(callbackUrl ?? "/");
  }

  const errorMessage = error ? (errorMessages[error] ?? errorMessages.Default) : null;

  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/" });
  }

  async function signInWithResend(formData: FormData) {
    "use server";
    try {
      await signIn("resend", formData);
    } catch (e) {
      if (e instanceof AuthError) {
        redirect("/entrar?error=Default");
      }
      throw e;
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">resenha</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            A plataforma da sua pelada. Entra e bora!
          </p>
        </header>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            {errorMessage}
          </div>
        )}

        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-zinc-300 bg-white px-5 text-base font-medium text-zinc-900 transition-colors hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
          >
            <GoogleIcon />
            Entrar com Google
          </button>
        </form>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          <span className="text-xs uppercase tracking-wider text-zinc-500">ou</span>
          <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        </div>

        <form action={signInWithResend} className="space-y-3">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Seu e-mail
            </label>
            <input
              id="email"
              type="email"
              name="email"
              required
              placeholder="voce@exemplo.com"
              autoComplete="email"
              className="block h-12 w-full rounded-md border border-zinc-300 bg-white px-3 text-base text-zinc-900 placeholder-zinc-400 focus-visible:border-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus-visible:border-zinc-50 dark:focus-visible:ring-zinc-50"
            />
          </div>
          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center rounded-full bg-zinc-900 px-5 text-base font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Receber link de acesso
          </button>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            A gente manda um link mágico no teu e-mail. Sem senha.
          </p>
        </form>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <title>Google</title>
      <path
        d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 0 1-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35Z"
        fill="#4285F4"
      />
      <path
        d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0 0 10 20Z"
        fill="#34A853"
      />
      <path
        d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 0 0 0 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59Z"
        fill="#FBBC05"
      />
      <path
        d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0A9.996 9.996 0 0 0 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977Z"
        fill="#EA4335"
      />
    </svg>
  );
}
