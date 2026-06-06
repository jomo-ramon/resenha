import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { assertRole, getPeladaContext } from "@/lib/multitenancy";
import { NovaPartidaForm } from "./nova-partida-form";

type Params = Promise<{ peladaSlug: string }>;

export const metadata: Metadata = {
  title: "Nova partida — resenha",
};

export default async function NovaPartidaPage({ params }: { params: Params }) {
  const { peladaSlug } = await params;

  try {
    const ctx = await getPeladaContext(peladaSlug);
    assertRole(ctx, "admin");
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    if (error instanceof ForbiddenError) redirect(`/p/${peladaSlug}`);
    throw error;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <Link
          href={`/p/${peladaSlug}`}
          className="text-sm text-zinc-500 underline-offset-4 hover:underline"
        >
          ← Voltar pra pelada
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Nova partida</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          A lista de presença abre automaticamente. Você pode confirmar a galera depois.
        </p>
      </header>

      <NovaPartidaForm slug={peladaSlug} />
    </div>
  );
}
