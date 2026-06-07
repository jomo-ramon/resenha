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
        <section className="relative overflow-hidden border-b border-[color:var(--color-border)]">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
            <div className="max-w-xl space-y-6">
              <p className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-brand)]/30 bg-[color:var(--color-brand-soft)] px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand)]">
                <BallGlyph size={14} />A plataforma da sua pelada
              </p>
              <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
                Organiza a pelada{" "}
                <span className="text-[color:var(--color-brand)]">
                  sem WhatsApp e sem planilha.
                </span>
              </h1>
              <p className="text-lg text-[color:var(--color-ink-soft)] sm:text-xl">
                Lista de presença, sorteio de times, placar ao vivo e ranking de artilharia. Tudo
                num lugar só.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <ButtonLink href="/entrar" variant="primary" size="xl">
                  Entrar
                </ButtonLink>
                <ButtonLink href="/entrar" variant="outline" size="xl">
                  Criar minha pelada
                </ButtonLink>
              </div>
            </div>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[color:var(--color-brand)] opacity-25 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 -left-10 h-80 w-80 rounded-full bg-[color:var(--color-accent)] opacity-10 blur-3xl"
          />
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
