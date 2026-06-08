import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { assertRole, getPeladaContext } from "@/lib/multitenancy";
import { listPeladaMembers } from "@/server/queries/peladas";
import { NovaPartidaForm } from "./nova-partida-form";

type Params = Promise<{ peladaSlug: string }>;

export const metadata: Metadata = {
  title: "Nova partida — resenha",
};

export default async function NovaPartidaPage({ params }: { params: Params }) {
  const { peladaSlug } = await params;

  let peladaId: string;
  try {
    const ctx = await getPeladaContext(peladaSlug);
    assertRole(ctx, "admin");
    peladaId = ctx.pelada.id;
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    if (error instanceof ForbiddenError) redirect(`/p/${peladaSlug}`);
    throw error;
  }

  const members = await listPeladaMembers(peladaId);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link
        href={`/p/${peladaSlug}/partidas`}
        className="text-sm text-[color:var(--color-ink-soft)] underline-offset-4 hover:underline"
      >
        ← Voltar pras partidas
      </Link>

      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-brand)]">
          Agendar partida
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">Quando e onde rola?</h1>
        <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">
          A lista de presença abre automaticamente.
        </p>
      </header>

      <NovaPartidaForm
        slug={peladaSlug}
        members={members.map((m) => ({
          membershipId: m.membershipId,
          displayName: m.displayName,
          role: m.role,
        }))}
      />
    </div>
  );
}
