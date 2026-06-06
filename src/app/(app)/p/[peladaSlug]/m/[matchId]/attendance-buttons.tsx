"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";
import type { RosterEntryStatus } from "@/lib/db/schema";
import {
  type AttendanceState,
  confirmAttendanceAction,
  declineAttendanceAction,
} from "@/server/actions/match/attendance";

const initialState: AttendanceState = { status: "idle" };

export function AttendanceButtons({
  slug,
  matchId,
  currentStatus,
}: {
  slug: string;
  matchId: string;
  currentStatus: RosterEntryStatus | null;
}) {
  const confirmBound = confirmAttendanceAction.bind(null, slug, matchId);
  const declineBound = declineAttendanceAction.bind(null, slug, matchId);
  const [confirmState, confirmAction] = useActionState(confirmBound, initialState);
  const [declineState, declineAction] = useActionState(declineBound, initialState);

  const lastError =
    confirmState.status === "error"
      ? confirmState.message
      : declineState.status === "error"
        ? declineState.message
        : null;

  const isConfirmed = currentStatus === "confirmed" || currentStatus === "waitlist";

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {!isConfirmed ? (
          <form action={confirmAction} className="contents">
            <PrimaryButton>✓ Vou jogar</PrimaryButton>
          </form>
        ) : (
          <div className="flex h-12 items-center justify-center rounded-full border border-[color:var(--color-brand)]/30 bg-[color:var(--color-brand-soft)] text-sm font-bold text-[color:var(--color-brand-ink)]">
            ✓ Confirmado
          </div>
        )}

        {currentStatus === "declined" ? (
          <form action={confirmAction} className="contents">
            <SecondaryButton>Mudei de ideia</SecondaryButton>
          </form>
        ) : (
          <form action={declineAction} className="contents">
            <SecondaryButton>Não vou poder</SecondaryButton>
          </form>
        )}
      </div>
      {lastError && (
        <p className="text-xs font-medium text-[color:var(--color-danger)]">{lastError}</p>
      )}
    </div>
  );
}

function PrimaryButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" fullWidth disabled={pending}>
      {pending ? "..." : children}
    </Button>
  );
}

function SecondaryButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="lg" fullWidth disabled={pending}>
      {pending ? "..." : children}
    </Button>
  );
}
