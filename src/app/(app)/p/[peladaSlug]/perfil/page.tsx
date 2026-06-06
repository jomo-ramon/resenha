import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { getPeladaContext } from "@/lib/multitenancy";
import { PerfilForm } from "./perfil-form";

type Params = Promise<{ peladaSlug: string }>;

export const metadata: Metadata = {
  title: "Meu perfil — resenha",
};

export default async function PerfilPage({ params }: { params: Params }) {
  const { peladaSlug } = await params;

  let ctx: Awaited<ReturnType<typeof getPeladaContext>>;
  try {
    ctx = await getPeladaContext(peladaSlug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    if (error instanceof ForbiddenError) redirect("/peladas");
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
        <h1 className="text-3xl font-bold tracking-tight">Meu perfil em {ctx.pelada.name}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Seu apelido é o que vai aparecer pra galera nos times e no ranking.
        </p>
      </header>

      <PerfilForm
        slug={peladaSlug}
        defaults={{
          nickname: ctx.membership.nickname ?? "",
          shirtNumber: ctx.membership.shirtNumber,
          preferredPosition: ctx.membership.preferredPosition,
        }}
      />
    </div>
  );
}
