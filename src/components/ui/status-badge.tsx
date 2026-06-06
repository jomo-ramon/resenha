import type { MatchStatus } from "@/lib/db/schema";
import { Badge, LiveBadge } from "./badge";

const MATCH_STATUS_CONFIG: Record<
  MatchStatus,
  { label: string; tone: Parameters<typeof Badge>[0]["tone"] }
> = {
  scheduled: { label: "Agendada", tone: "warning" },
  roster_open: { label: "Lista aberta", tone: "brand" },
  teams_drafted: { label: "Times sorteados", tone: "info" },
  in_progress: { label: "Em andamento", tone: "live" },
  finished: { label: "Finalizada", tone: "muted" },
  cancelled: { label: "Cancelada", tone: "danger" },
};

export function MatchStatusBadge({ status }: { status: MatchStatus }) {
  if (status === "in_progress") return <LiveBadge />;
  const cfg = MATCH_STATUS_CONFIG[status];
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}
