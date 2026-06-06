import Link from "next/link";
import { MatchStatusBadge } from "@/components/ui";
import type { Match } from "@/lib/db/schema";
import { cn } from "@/lib/utils/cn";

const SHORT_DAY = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  timeZone: "America/Sao_Paulo",
});

const TIME = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export function MatchCard({
  match,
  peladaSlug,
  confirmedCount,
  maxPlayers,
  highlight,
}: {
  match: Match;
  peladaSlug: string;
  confirmedCount: number;
  maxPlayers: number | null;
  highlight?: boolean;
}) {
  const isLive = match.status === "in_progress";
  const date = SHORT_DAY.format(match.scheduledFor).replace(",", " ·");
  const time = TIME.format(match.scheduledFor);

  return (
    <Link
      href={`/p/${peladaSlug}/m/${match.id}`}
      className={cn(
        "block rounded-2xl border bg-[color:var(--color-surface-raised)] p-4 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]",
        highlight
          ? "border-[color:var(--color-brand)]/40 ring-1 ring-[color:var(--color-brand)]/15"
          : "border-[color:var(--color-border)]",
        isLive && "border-[color:var(--color-brand)]/60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--color-ink-muted)]">
            {date}
          </p>
          <p className="mt-0.5 text-2xl font-extrabold tabular-nums text-[color:var(--color-ink)]">
            {time}
          </p>
        </div>
        <MatchStatusBadge status={match.status} />
      </div>

      {match.locationOverride && (
        <p className="mt-2 text-xs text-[color:var(--color-ink-soft)]">
          📍 {match.locationOverride}
        </p>
      )}

      {match.status !== "cancelled" && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <PresenceBar confirmed={confirmedCount} max={maxPlayers ?? 0} />
          <span className="font-medium text-[color:var(--color-ink-soft)] tabular-nums">
            {confirmedCount}
            {maxPlayers ? ` / ${maxPlayers}` : ""}
          </span>
        </div>
      )}
    </Link>
  );
}

function PresenceBar({ confirmed, max }: { confirmed: number; max: number }) {
  if (!max) return null;
  const pct = Math.min(100, Math.round((confirmed / max) * 100));
  const full = pct >= 100;
  return (
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[color:var(--color-surface-muted)]">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          full ? "bg-[color:var(--color-warning)]" : "bg-[color:var(--color-brand)]",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
