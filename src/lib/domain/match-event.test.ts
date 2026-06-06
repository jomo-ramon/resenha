import { describe, expect, it } from "vitest";
import { addMatchEventInputSchema, computeScore } from "./match-event";

describe("addMatchEventInputSchema", () => {
  it("accepts a valid goal", () => {
    const r = addMatchEventInputSchema.safeParse({
      teamId: "t1",
      membershipId: "m1",
      type: "goal",
      minute: 12,
    });
    expect(r.success).toBe(true);
  });

  it("accepts events without minute", () => {
    const r = addMatchEventInputSchema.safeParse({
      teamId: "t1",
      membershipId: "m1",
      type: "assist",
    });
    expect(r.success).toBe(true);
  });

  it("rejects unknown type", () => {
    const r = addMatchEventInputSchema.safeParse({
      teamId: "t1",
      membershipId: "m1",
      type: "penalty",
    });
    expect(r.success).toBe(false);
  });

  it("rejects empty ids", () => {
    expect(
      addMatchEventInputSchema.safeParse({ teamId: "", membershipId: "m1", type: "goal" }).success,
    ).toBe(false);
    expect(
      addMatchEventInputSchema.safeParse({ teamId: "t1", membershipId: "", type: "goal" }).success,
    ).toBe(false);
  });

  it("rejects out-of-range minute", () => {
    expect(
      addMatchEventInputSchema.safeParse({
        teamId: "t1",
        membershipId: "m1",
        type: "goal",
        minute: -1,
      }).success,
    ).toBe(false);
    expect(
      addMatchEventInputSchema.safeParse({
        teamId: "t1",
        membershipId: "m1",
        type: "goal",
        minute: 181,
      }).success,
    ).toBe(false);
  });
});

describe("computeScore", () => {
  const L = "light-id";
  const D = "dark-id";

  it("returns 0x0 for no events", () => {
    expect(computeScore([], L, D)).toEqual({ light: 0, dark: 0 });
  });

  it("counts goals per team", () => {
    expect(
      computeScore(
        [
          { teamId: L, type: "goal" },
          { teamId: L, type: "goal" },
          { teamId: D, type: "goal" },
        ],
        L,
        D,
      ),
    ).toEqual({ light: 2, dark: 1 });
  });

  it("credits own_goal to the opposing team", () => {
    expect(
      computeScore(
        [
          { teamId: L, type: "own_goal" },
          { teamId: D, type: "own_goal" },
        ],
        L,
        D,
      ),
    ).toEqual({ light: 1, dark: 1 });
  });

  it("ignores assists and cards in the score", () => {
    expect(
      computeScore(
        [
          { teamId: L, type: "assist" },
          { teamId: L, type: "yellow_card" },
          { teamId: D, type: "red_card" },
          { teamId: L, type: "goal" },
        ],
        L,
        D,
      ),
    ).toEqual({ light: 1, dark: 0 });
  });
});
