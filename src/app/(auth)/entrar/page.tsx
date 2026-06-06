import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { Button, Field, inputClass, Logo } from "@/components/ui";
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

function safeCallbackPath(raw: string | undefined): string {
  if (!raw) return "/peladas";
  if (!raw.startsWith("/")) return "/peladas";
  if (raw.startsWith("//")) return "/peladas";
  return raw;
}

export default async function EntrarPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  const { error, callbackUrl } = await searchParams;

  const target = safeCallbackPath(callbackUrl);

  if (session?.user) redirect(target);

  const errorMessage = error ? (errorMessages[error] ?? errorMessages.Default) : null;

  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: target });
  }

  async function signInWithResend(formData: FormData) {
    "use server";
    try {
      await signIn("resend", formData);
    } catch (e) {
      if (e instanceof AuthError) {
        const errorTarget = `/entrar?error=Default&callbackUrl=${encodeURIComponent(target)}`;
        redirect(errorTarget);
      }
      throw e;
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-[color:var(--color-border)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="inline-flex">
            <Logo size="md" className="text-[color:var(--color-brand)]" />
          </Link>
          <Link
            href="/"
            className="text-sm text-[color:var(--color-ink-soft)] underline-offset-4 hover:underline"
          >
            ← Voltar
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight">Entra na resenha</h1>
            <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">
              Login rápido com Google ou link mágico no e-mail.
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-[color:var(--color-danger)]/30 bg-[color:var(--color-danger-soft)] px-4 py-3 text-sm font-medium text-[color:var(--color-danger)]"
            >
              {errorMessage}
            </div>
          )}

          <form action={signInWithGoogle}>
            <Button
              type="submit"
              variant="outline"
              size="xl"
              fullWidth
              leadingIcon={<GoogleIcon />}
            >
              Continuar com Google
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-[color:var(--color-border)]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-ink-muted)]">
              ou
            </span>
            <span className="h-px flex-1 bg-[color:var(--color-border)]" />
          </div>

          <form action={signInWithResend} className="space-y-4">
            <input type="hidden" name="redirectTo" value={target} />
            <Field
              label="Seu e-mail"
              htmlFor="email"
              hint="A gente manda um link mágico, sem senha."
            >
              <input
                id="email"
                type="email"
                name="email"
                required
                placeholder="voce@exemplo.com"
                autoComplete="email"
                className={inputClass}
              />
            </Field>
            <Button type="submit" variant="primary" size="xl" fullWidth>
              Receber link no e-mail
            </Button>
          </form>
        </div>
      </main>
    </div>
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
