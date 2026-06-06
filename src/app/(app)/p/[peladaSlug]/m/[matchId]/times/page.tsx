import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { assertRole, getPeladaContext } from "@/lib/multitenancy";
import { getMatchWithRoster } from "@/server/queries/matches";
import { TeamDraftEditor } from "./team-draft-editor";

type Params = Promise<{ peladaSlug: string; matchId: string }>;

export const metadata: Metadata = {
  title: "Sortear times — resenha",
};

export default async function DraftTeamsPage({ params }: { params: Params }) {
  const { peladaSlug, matchId } = await params;

  let ctx: Awaited<ReturnType<typeof getPeladaContext>>;
  try {
    ctx = await getPeladaContext(peladaSlug);
    assertRole(ctx, "admin");
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    if (error instanceof ForbiddenError) redirect(`/p/${peladaSlug}/m/${matchId}`);
    throw error;
  }

  const detail = await getMatchWithRoster(ctx.pelada.id, matchId);
  if (!detail) notFound();

  const { match, roster, teams } = detail;
  if (match.status !== "roster_open" && match.status !== "teams_drafted") {
    redirect(`/p/${peladaSlug}/m/${matchId}`);
  }

  const confirmed = roster.filter((r) => r.status === "confirmed");
  if (confirmed.length < 2) {
    return (
      <div className="space-y-4">
        <Link
          href={`/p/${peladaSlug}/m/${matchId}`}
          className="text-sm text-[color:var(--color-ink-soft)] underline-offset-4 hover:underline"
        >
          ← Voltar pra partida
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">Sortear times</h1>
        <p className="rounded-xl border border-[color:var(--color-warning)]/30 bg-[color:var(--color-warning-soft)] px-4 py-3 text-sm font-medium text-[color:var(--color-warning)]">
          Precisa de pelo menos 2 jogadores confirmados pra sortear.
        </p>
      </div>
    );
  }

  const lightTeamData = teams.find((t) => t.team.name === "Time Claro");
  const darkTeamData = teams.find((t) => t.team.name === "Time Escuro");

  const initial = {
    assignments: confirmed.reduce<Record<string, "light" | "dark" | null>>((acc, r) => {
      acc[r.membershipId] = lightTeamData?.playerMembershipIds.includes(r.membershipId)
        ? "light"
        : darkTeamData?.playerMembershipIds.includes(r.membershipId)
          ? "dark"
          : null;
      return acc;
    }, {}),
    captains: {
      light: lightTeamData?.team.captainMembershipId ?? null,
      dark: darkTeamData?.team.captainMembershipId ?? null,
    },
  };

  return (
    <div className="space-y-6">
      <Link
        href={`/p/${peladaSlug}/m/${matchId}`}
        className="text-sm text-[color:var(--color-ink-soft)] underline-offset-4 hover:underline"
      >
        ← Voltar pra partida
      </Link>

      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-brand)]">
          Sortear times
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">{confirmed.length} jogadores</h1>
        <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">
          Toque em cada nome pra mandar pra um time.
        </p>
      </header>

      <TeamDraftEditor
        slug={peladaSlug}
        matchId={matchId}
        pool={confirmed.map((r) => ({ membershipId: r.membershipId, displayName: r.displayName }))}
        initialAssignments={initial.assignments}
        initialCaptains={initial.captains}
      />
    </div>
  );
}
