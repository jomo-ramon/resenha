import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, BallGlyph, ButtonLink, Card } from "@/components/ui";
import { listPeladasOfCurrentUser } from "@/server/queries/peladas";

export const metadata: Metadata = {
  title: "Minhas peladas — resenha",
};

const WEEKDAY_LABELS: Record<string, string> = {
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sábado",
  sunday: "Domingo",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  referee: "Juiz",
  player: "Jogador",
};

export default async function PeladasPage() {
  const peladas = await listPeladasOfCurrentUser();

  if (peladas.length === 0) redirect("/nova-pelada");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-ink-muted)]">
            {peladas.length === 1 ? "1 pelada" : `${peladas.length} peladas`}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight">Suas peladas</h1>
        </div>
        <ButtonLink
          href="/nova-pelada"
          variant="primary"
          size="md"
          leadingIcon={<span aria-hidden="true">+</span>}
        >
          Nova pelada
        </ButtonLink>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {peladas.map((p) => (
          <li key={p.id}>
            <Link href={`/p/${p.slug}`} className="group block h-full focus-visible:outline-none">
              <Card
                elevation="raised"
                className="h-full transition-shadow group-hover:shadow-[var(--shadow-md)]"
              >
                <div className="flex items-start gap-3 p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--color-brand)] text-white shadow-[var(--shadow-brand)]">
                    <BallGlyph size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="truncate text-lg font-extrabold tracking-tight">{p.name}</h2>
                      <Badge tone={p.role === "admin" ? "brand" : "neutral"} size="xs">
                        {ROLE_LABELS[p.role] ?? p.role}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">
                      {WEEKDAY_LABELS[p.weekday] ?? p.weekday} · {p.startTime}
                    </p>
                    <p className="mt-0.5 text-xs text-[color:var(--color-ink-muted)]">
                      📍 {p.location}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
