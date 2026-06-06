import { describe, expect, it } from "vitest";
import { buildDraftFromAssignments, draftTeamsInputSchema } from "./team-draft";

describe("draftTeamsInputSchema", () => {
  const valid = {
    light: { members: ["m1", "m2"], captainMembershipId: "m1" },
    dark: { members: ["m3", "m4"], captainMembershipId: "m3" },
  };

  it("accepts a clean partition", () => {
    expect(draftTeamsInputSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty team", () => {
    const r = draftTeamsInputSchema.safeParse({
      ...valid,
      light: { members: [], captainMembershipId: "m1" },
    });
    expect(r.success).toBe(false);
  });

  it("rejects captain not in their team", () => {
    const r = draftTeamsInputSchema.safeParse({
      ...valid,
      light: { members: ["m1", "m2"], captainMembershipId: "m3" },
    });
    expect(r.success).toBe(false);
  });

  it("rejects player in both teams", () => {
    const r = draftTeamsInputSchema.safeParse({
      light: { members: ["m1", "m2"], captainMembershipId: "m1" },
      dark: { members: ["m2", "m3"], captainMembershipId: "m3" },
    });
    expect(r.success).toBe(false);
  });
});

describe("buildDraftFromAssignments", () => {
  it("builds a valid draft when assignments cover both teams", () => {
    const r = buildDraftFromAssignments(
      ["m1", "m2", "m3", "m4"],
      { m1: "light", m2: "light", m3: "dark", m4: "dark" },
      { light: null, dark: null },
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.input.light.members).toEqual(["m1", "m2"]);
      expect(r.input.dark.members).toEqual(["m3", "m4"]);
      expect(r.input.light.captainMembershipId).toBe("m1");
      expect(r.input.dark.captainMembershipId).toBe("m3");
    }
  });

  it("ignores members not assigned to any team", () => {
    const r = buildDraftFromAssignments(
      ["m1", "m2", "m3"],
      { m1: "light", m2: null, m3: "dark" },
      { light: null, dark: null },
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.input.light.members).toEqual(["m1"]);
      expect(r.input.dark.members).toEqual(["m3"]);
    }
  });

  it("honors explicit captain choice", () => {
    const r = buildDraftFromAssignments(
      ["m1", "m2", "m3", "m4"],
      { m1: "light", m2: "light", m3: "dark", m4: "dark" },
      { light: "m2", dark: "m4" },
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.input.light.captainMembershipId).toBe("m2");
      expect(r.input.dark.captainMembershipId).toBe("m4");
    }
  });

  it("fails when one team is empty", () => {
    const r = buildDraftFromAssignments(
      ["m1", "m2"],
      { m1: "light", m2: "light" },
      { light: null, dark: null },
    );
    expect(r.ok).toBe(false);
  });

  it("rejects when captain choice is outside the team", () => {
    const r = buildDraftFromAssignments(
      ["m1", "m2", "m3", "m4"],
      { m1: "light", m2: "light", m3: "dark", m4: "dark" },
      { light: "m3", dark: "m4" },
    );
    expect(r.ok).toBe(false);
  });
});
