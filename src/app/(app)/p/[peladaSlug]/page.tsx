import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { getPeladaContext } from "@/lib/multitenancy";
import { InvitePanel } from "./invite-panel";

type Params = Promise<{ peladaSlug: string }>;

const WEEKDAY_LABELS: Record<string, string> = {
  monday: "Segunda-feira",
  tuesday: "Terça-feira",
  wednesday: "Quarta-feira",
  thursday: "Quinta-feira",
  friday: "Sexta-feira",
  saturday: "Sábado",
  sunday: "Domingo",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  referee: "Juiz",
  player: "Jogador",
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { peladaSlug } = await params;
  return { title: `${peladaSlug} — resenha` };
}

export default async function PeladaDashboardPage({ params }: { params: Params }) {
  const { peladaSlug } = await params;

  let ctx: Awaited<ReturnType<typeof getPeladaContext>>;
  try {
    ctx = await getPeladaContext(peladaSlug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    if (error instanceof ForbiddenError) redirect("/peladas");
    throw error;
  }

  const { pelada, membership } = ctx;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Pelada</p>
          <h1 className="truncate text-3xl font-bold tracking-tight">{pelada.name}</h1>
          {pelada.description && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{pelada.description}</p>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {ROLE_LABELS[membership.role] ?? membership.role}
        </span>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Quando e onde
        </h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <Info label="Dia">{WEEKDAY_LABELS[pelada.weekday] ?? pelada.weekday}</Info>
          <Info label="Horário">{pelada.startTime}</Info>
          <Info label="Local">{pelada.location}</Info>
          <Info label="Capacidade">Até {pelada.maxPlayers} jogadores</Info>
        </dl>
        {pelada.address && (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{pelada.address}</p>
        )}
      </section>

      {membership.role === "admin" && (
        <InvitePanel slug={pelada.slug} inviteToken={pelada.inviteToken} />
      )}

      <section className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
        <h2 className="text-lg font-semibold">Nenhuma partida ainda</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Agendamento de partida vem no próximo bloco. Por enquanto, a pelada tá criada e você é{" "}
          {membership.role === "admin" ? "o admin" : "membro"}.
        </p>
        <Link
          href="/peladas"
          className="mt-4 inline-block text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
        >
          ← Voltar pra minhas peladas
        </Link>
      </section>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-base font-medium">{children}</dd>
    </div>
  );
}
