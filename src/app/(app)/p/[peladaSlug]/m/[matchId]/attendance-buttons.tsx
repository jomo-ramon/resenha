"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
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
      <div className="flex flex-wrap gap-2">
        {!isConfirmed && (
          <form action={confirmAction}>
            <PrimaryButton>Vou jogar</PrimaryButton>
          </form>
        )}
        {currentStatus !== "declined" && currentStatus !== null && (
          <form action={declineAction}>
            <SecondaryButton>Não vou poder</SecondaryButton>
          </form>
        )}
        {currentStatus === "declined" && (
          <form action={confirmAction}>
            <PrimaryButton>Mudei de ideia — vou jogar</PrimaryButton>
          </form>
        )}
      </div>
      {lastError && <p className="text-xs text-red-600 dark:text-red-400">{lastError}</p>}
    </div>
  );
}

function PrimaryButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
    >
      {pending ? "..." : children}
    </button>
  );
}

function SecondaryButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
    >
      {pending ? "..." : children}
    </button>
  );
}
