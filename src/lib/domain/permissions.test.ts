import { describe, expect, it } from "vitest";
import type { Match } from "@/lib/db/schema/matches";
import type { Membership } from "@/lib/db/schema/peladas";
import { canAssignReferee, canRefereeMatch, isDesignatedReferee } from "./permissions";

function makeMembership(overrides: Partial<Membership> = {}): Membership {
  return {
    id: "m1",
    userId: "u1",
    peladaId: "p1",
    role: "player",
    nickname: null,
    shirtNumber: null,
    preferredPosition: "outfield",
    status: "active",
    joinedAt: new Date(),
    ...overrides,
  };
}

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: "match1",
    peladaId: "p1",
    scheduledFor: new Date(),
    locationOverride: null,
    status: "scheduled",
    activeRefereeId: null,
    finishedAt: null,
    notes: null,
    createdAt: new Date(),
    ...overrides,
  };
}

describe("canRefereeMatch", () => {
  it("true when membership is the designated referee", () => {
    const m = makeMembership({ id: "ref1" });
    const match = makeMatch({ activeRefereeId: "ref1" });
    expect(canRefereeMatch(m, match)).toBe(true);
  });

  it("true for admin when no referee is designated", () => {
    const m = makeMembership({ role: "admin" });
    const match = makeMatch({ activeRefereeId: null });
    expect(canRefereeMatch(m, match)).toBe(true);
  });

  it("false for admin when another referee is designated", () => {
    const m = makeMembership({ id: "admin1", role: "admin" });
    const match = makeMatch({ activeRefereeId: "ref1" });
    expect(canRefereeMatch(m, match)).toBe(false);
  });

  it("false for player when no referee designated", () => {
    const m = makeMembership({ role: "player" });
    const match = makeMatch({ activeRefereeId: null });
    expect(canRefereeMatch(m, match)).toBe(false);
  });

  it("false for unrelated player even with a referee designated", () => {
    const m = makeMembership({ id: "other", role: "player" });
    const match = makeMatch({ activeRefereeId: "ref1" });
    expect(canRefereeMatch(m, match)).toBe(false);
  });
});

describe("isDesignatedReferee", () => {
  it("false when no referee assigned", () => {
    expect(isDesignatedReferee(makeMembership(), makeMatch({ activeRefereeId: null }))).toBe(false);
  });

  it("true for the designated membership only", () => {
    expect(
      isDesignatedReferee(makeMembership({ id: "ref1" }), makeMatch({ activeRefereeId: "ref1" })),
    ).toBe(true);
    expect(
      isDesignatedReferee(makeMembership({ id: "other" }), makeMatch({ activeRefereeId: "ref1" })),
    ).toBe(false);
  });

  it("does NOT confer the badge to admins when no one is designated", () => {
    expect(
      isDesignatedReferee(makeMembership({ role: "admin" }), makeMatch({ activeRefereeId: null })),
    ).toBe(false);
  });
});

describe("canAssignReferee", () => {
  it("only admins", () => {
    expect(
      canAssignReferee(makeMembership({ role: "admin" }), makeMatch({ status: "scheduled" })),
    ).toBe(true);
    expect(
      canAssignReferee(makeMembership({ role: "player" }), makeMatch({ status: "scheduled" })),
    ).toBe(false);
  });

  it("blocked once match is finished or cancelled", () => {
    const admin = makeMembership({ role: "admin" });
    expect(canAssignReferee(admin, makeMatch({ status: "finished" }))).toBe(false);
    expect(canAssignReferee(admin, makeMatch({ status: "cancelled" }))).toBe(false);
    expect(canAssignReferee(admin, makeMatch({ status: "in_progress" }))).toBe(true);
  });
});
