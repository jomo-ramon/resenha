import { describe, expect, it } from "vitest";
import {
  canCancelMatch,
  canTransition,
  createMatchInputSchema,
  isRosterAcceptingResponses,
} from "./match";

describe("createMatchInputSchema", () => {
  const future = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

  it("accepts a future datetime", () => {
    const result = createMatchInputSchema.safeParse({ scheduledFor: future });
    expect(result.success).toBe(true);
  });

  it("rejects an empty datetime", () => {
    expect(createMatchInputSchema.safeParse({ scheduledFor: "" }).success).toBe(false);
  });

  it("rejects malformed datetime strings", () => {
    expect(createMatchInputSchema.safeParse({ scheduledFor: "amanhã" }).success).toBe(false);
  });

  it("rejects a past datetime", () => {
    expect(createMatchInputSchema.safeParse({ scheduledFor: past }).success).toBe(false);
  });

  it("accepts optional empty locationOverride and notes", () => {
    const result = createMatchInputSchema.safeParse({
      scheduledFor: future,
      locationOverride: "",
      notes: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects locationOverride longer than 120 chars", () => {
    const result = createMatchInputSchema.safeParse({
      scheduledFor: future,
      locationOverride: "x".repeat(121),
    });
    expect(result.success).toBe(false);
  });
});

describe("canTransition", () => {
  it("allows scheduled → roster_open and scheduled → cancelled", () => {
    expect(canTransition("scheduled", "roster_open")).toBe(true);
    expect(canTransition("scheduled", "cancelled")).toBe(true);
  });

  it("allows roster_open → teams_drafted and roster_open → cancelled", () => {
    expect(canTransition("roster_open", "teams_drafted")).toBe(true);
    expect(canTransition("roster_open", "cancelled")).toBe(true);
  });

  it("forbids scheduled → in_progress (must pass through teams_drafted)", () => {
    expect(canTransition("scheduled", "in_progress")).toBe(false);
  });

  it("forbids any transition out of finished or cancelled", () => {
    expect(canTransition("finished", "in_progress")).toBe(false);
    expect(canTransition("finished", "scheduled")).toBe(false);
    expect(canTransition("cancelled", "scheduled")).toBe(false);
  });

  it("forbids in_progress → cancelled (use finished instead)", () => {
    expect(canTransition("in_progress", "cancelled")).toBe(false);
  });
});

describe("isRosterAcceptingResponses", () => {
  it("is true only while roster_open", () => {
    expect(isRosterAcceptingResponses("roster_open")).toBe(true);
    expect(isRosterAcceptingResponses("scheduled")).toBe(false);
    expect(isRosterAcceptingResponses("teams_drafted")).toBe(false);
    expect(isRosterAcceptingResponses("in_progress")).toBe(false);
  });
});

describe("canCancelMatch", () => {
  it("allows cancel before sorting teams", () => {
    expect(canCancelMatch("scheduled")).toBe(true);
    expect(canCancelMatch("roster_open")).toBe(true);
  });

  it("forbids cancel once teams or events exist", () => {
    expect(canCancelMatch("teams_drafted")).toBe(false);
    expect(canCancelMatch("in_progress")).toBe(false);
    expect(canCancelMatch("finished")).toBe(false);
    expect(canCancelMatch("cancelled")).toBe(false);
  });
});
