import { describe, expect, it } from "vitest";
import type { PeladaRules } from "@/lib/db/schema/peladas";
import { aggregateCounts, computePoints, DEFAULT_EVENT_POINTS, getEventPoints } from "./scout";

describe("getEventPoints", () => {
  it("returns defaults when rules is null/undefined", () => {
    expect(getEventPoints("goal", null)).toBe(DEFAULT_EVENT_POINTS.goal);
    expect(getEventPoints("save", undefined)).toBe(DEFAULT_EVENT_POINTS.save);
  });

  it("returns defaults when override is empty", () => {
    const rules: PeladaRules = {};
    expect(getEventPoints("goal", rules)).toBe(DEFAULT_EVENT_POINTS.goal);
  });

  it("respects per-event override", () => {
    const rules: PeladaRules = { eventPoints: { goal: 10, tackle: 2 } };
    expect(getEventPoints("goal", rules)).toBe(10);
    expect(getEventPoints("tackle", rules)).toBe(2);
    expect(getEventPoints("assist", rules)).toBe(DEFAULT_EVENT_POINTS.assist);
  });

  it("allows zero as a valid override", () => {
    const rules: PeladaRules = { eventPoints: { yellow_card: 0 } };
    expect(getEventPoints("yellow_card", rules)).toBe(0);
  });
});

describe("computePoints", () => {
  it("returns empty map for no events", () => {
    expect(computePoints([], null).size).toBe(0);
  });

  it("sums points per player using defaults", () => {
    const points = computePoints(
      [
        { membershipId: "p1", type: "goal" },
        { membershipId: "p1", type: "assist" },
        { membershipId: "p2", type: "goal" },
        { membershipId: "p2", type: "yellow_card" },
      ],
      null,
    );
    expect(points.get("p1")).toBe(DEFAULT_EVENT_POINTS.goal + DEFAULT_EVENT_POINTS.assist);
    expect(points.get("p2")).toBe(DEFAULT_EVENT_POINTS.goal + DEFAULT_EVENT_POINTS.yellow_card);
  });

  it("applies overrides", () => {
    const rules: PeladaRules = { eventPoints: { goal: 100 } };
    const points = computePoints([{ membershipId: "p1", type: "goal" }], rules);
    expect(points.get("p1")).toBe(100);
  });

  it("supports negative totals", () => {
    const points = computePoints(
      [
        { membershipId: "p1", type: "red_card" },
        { membershipId: "p1", type: "own_goal" },
      ],
      null,
    );
    expect(points.get("p1")).toBe(DEFAULT_EVENT_POINTS.red_card + DEFAULT_EVENT_POINTS.own_goal);
  });
});

describe("aggregateCounts", () => {
  it("counts each event type and total points", () => {
    const counts = aggregateCounts(
      [
        { membershipId: "p1", type: "goal" },
        { membershipId: "p1", type: "goal" },
        { membershipId: "p1", type: "assist" },
        { membershipId: "p1", type: "save" },
      ],
      null,
    );
    const p1 = counts.get("p1");
    expect(p1).toBeDefined();
    expect(p1?.goal).toBe(2);
    expect(p1?.assist).toBe(1);
    expect(p1?.save).toBe(1);
    expect(p1?.totalPoints).toBe(
      2 * DEFAULT_EVENT_POINTS.goal + DEFAULT_EVENT_POINTS.assist + DEFAULT_EVENT_POINTS.save,
    );
  });
});
