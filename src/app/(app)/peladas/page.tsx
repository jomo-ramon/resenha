import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
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

  if (peladas.length === 0) {
    redirect("/nova-pelada");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Minhas peladas</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {peladas.length === 1
              ? "Você participa de 1 pelada."
              : `Você participa de ${peladas.length} peladas.`}
          </p>
        </div>
        <Link
          href="/nova-pelada"
          className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          + Nova pelada
        </Link>
      </div>

      <ul className="space-y-3">
        {peladas.map((p) => (
          <li key={p.id}>
            <Link
              href={`/p/${p.slug}`}
              className="block rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold">{p.name}</h2>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {WEEKDAY_LABELS[p.weekday] ?? p.weekday} às {p.startTime} · {p.location}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {ROLE_LABELS[p.role] ?? p.role}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
