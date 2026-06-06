import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BallGlyph, Logo } from "@/components/ui";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { peladas } from "@/lib/db/schema";
import { AcceptInviteForm } from "./accept-invite-form";

export const metadata: Metadata = {
  title: "Convite — resenha",
};

type Params = Promise<{ peladaSlug: string }>;
type SearchParams = Promise<{ token?: string }>;

const WEEKDAY_LABELS: Record<string, string> = {
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sábado",
  sunday: "Domingo",
};

export default async function AcceptInvitePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { peladaSlug } = await params;
  const { token } = await searchParams;

  if (!token) return <InvalidInviteScreen />;

  const [pelada] = await db
    .select({
      id: peladas.id,
      slug: peladas.slug,
      name: peladas.name,
      location: peladas.location,
      weekday: peladas.weekday,
      startTime: peladas.startTime,
      inviteToken: peladas.inviteToken,
    })
    .from(peladas)
    .where(eq(peladas.slug, peladaSlug))
    .limit(1);

  if (!pelada || pelada.inviteToken !== token) return <InvalidInviteScreen />;

  const session = await auth();
  if (!session?.user) {
    const callbackUrl = `/p/${peladaSlug}/entrar?token=${encodeURIComponent(token)}`;
    redirect(`/entrar?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-[color:var(--color-border)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Logo size="md" className="text-[color:var(--color-brand)]" />
          <Link
            href="/peladas"
            className="text-sm text-[color:var(--color-ink-soft)] underline-offset-4 hover:underline"
          >
            Pular
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[color:var(--color-brand)] text-white shadow-[var(--shadow-brand)]">
            <BallGlyph size={40} />
          </div>

          <header className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-brand)]">
              Você foi convidado
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight">{pelada.name}</h1>
            <p className="text-sm text-[color:var(--color-ink-soft)]">
              {WEEKDAY_LABELS[pelada.weekday] ?? pelada.weekday} · {pelada.startTime}
            </p>
            <p className="text-sm text-[color:var(--color-ink-soft)]">📍 {pelada.location}</p>
          </header>

          <AcceptInviteForm slug={pelada.slug} token={token} />

          <Link
            href="/peladas"
            className="inline-block text-sm text-[color:var(--color-ink-muted)] underline-offset-4 hover:underline"
          >
            Agora não
          </Link>
        </div>
      </main>
    </div>
  );
}

function InvalidInviteScreen() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-[color:var(--color-border)]">
        <div className="mx-auto flex max-w-5xl items-center px-4 py-4">
          <Logo size="md" className="text-[color:var(--color-brand)]" />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[color:var(--color-danger-soft)] text-3xl">
            🚫
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Convite inválido</h1>
          <p className="text-sm text-[color:var(--color-ink-soft)]">
            Esse link expirou ou foi revogado. Pede um novo ao admin da pelada.
          </p>
          <Link
            href="/"
            className="inline-block text-sm font-semibold text-[color:var(--color-ink)] underline-offset-4 hover:underline"
          >
            Voltar pro início
          </Link>
        </div>
      </main>
    </div>
  );
}
