import { redirect } from "next/navigation";
import { BallGlyph, ButtonLink, Logo } from "@/components/ui";
import { auth } from "@/lib/auth";

const FEATURES = [
  {
    icon: "📋",
    title: "Lista de presença",
    description: "Galera confirma num tap. Acabou planilha e mensagem perdida.",
  },
  {
    icon: "🎲",
    title: "Sorteio de times",
    description: "Monta os times rápido. Times Claro e Escuro, capitão definido.",
  },
  {
    icon: "📊",
    title: "Ranking de artilharia",
    description: "Cada gol entra no histórico. Quem mais marcou no ano?",
  },
  {
    icon: "📱",
    title: "Funciona no celular",
    description: "Instala como app no Android e iOS. Sem loja, sem download.",
  },
];

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/peladas");

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Logo size="md" className="text-[color:var(--color-brand)]" />
          <ButtonLink href="/entrar" variant="ghost" size="sm">
            Entrar
          </ButtonLink>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-pitch relative overflow-hidden text-white">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
            <div className="max-w-xl space-y-6">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur">
                <BallGlyph size={14} className="text-white" />A plataforma da sua pelada
              </p>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
                Organiza a pelada sem WhatsApp e sem planilha.
              </h1>
              <p className="text-lg text-white/85 sm:text-xl">
                Lista de presença, sorteio de times, placar ao vivo e ranking de artilharia. Tudo
                num lugar só.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <ButtonLink href="/entrar" variant="secondary" size="xl">
                  Entrar
                </ButtonLink>
                <ButtonLink
                  href="/entrar"
                  variant="outline"
                  size="xl"
                  className="border-white/40 bg-white/10 text-white hover:bg-white/20"
                >
                  Criar minha pelada
                </ButtonLink>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-ink-muted)]">
            O que tem dentro
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <li
                key={f.title}
                className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-5 shadow-[var(--shadow-sm)]"
              >
                <div className="text-3xl">{f.icon}</div>
                <h3 className="mt-3 text-base font-bold text-[color:var(--color-ink)]">
                  {f.title}
                </h3>
                <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">{f.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-16">
          <div className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-8 text-center shadow-[var(--shadow-sm)]">
            <h2 className="text-2xl font-extrabold tracking-tight">
              Pronto pra organizar o próximo sábado?
            </h2>
            <p className="mt-2 text-sm text-[color:var(--color-ink-soft)]">
              Cria sua pelada em menos de 1 minuto. Sem cartão de crédito.
            </p>
            <div className="mt-5 flex justify-center">
              <ButtonLink href="/entrar" variant="primary" size="xl">
                Começar agora
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
        <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-[color:var(--color-ink-muted)]">
          resenha · 2026
        </div>
      </footer>
    </div>
  );
}
