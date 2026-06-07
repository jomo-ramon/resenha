import { describe, expect, it } from "vitest";
import { averageRating, playerRatingSchema, ratingLabel } from "./player-rating";

describe("playerRatingSchema", () => {
  it("accepts a valid rating", () => {
    const r = playerRatingSchema.safeParse({ matchId: "m1", membershipId: "p1", rating: 7 });
    expect(r.success).toBe(true);
  });

  it("coerces string rating to number", () => {
    const r = playerRatingSchema.safeParse({
      matchId: "m1",
      membershipId: "p1",
      rating: "8" as unknown as number,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.rating).toBe(8);
  });

  it("rejects out-of-range ratings", () => {
    expect(
      playerRatingSchema.safeParse({ matchId: "m", membershipId: "p", rating: -1 }).success,
    ).toBe(false);
    expect(
      playerRatingSchema.safeParse({ matchId: "m", membershipId: "p", rating: 11 }).success,
    ).toBe(false);
  });

  it("rejects fractional ratings", () => {
    expect(
      playerRatingSchema.safeParse({ matchId: "m", membershipId: "p", rating: 7.5 }).success,
    ).toBe(false);
  });

  it("normalizes empty notes to undefined", () => {
    const r = playerRatingSchema.safeParse({
      matchId: "m",
      membershipId: "p",
      rating: 5,
      notes: "   ",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.notes).toBeUndefined();
  });

  it("trims notes whitespace", () => {
    const r = playerRatingSchema.safeParse({
      matchId: "m",
      membershipId: "p",
      rating: 5,
      notes: "  Carregou o time  ",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.notes).toBe("Carregou o time");
  });
});

describe("averageRating", () => {
  it("returns null for empty list", () => {
    expect(averageRating([])).toBeNull();
  });

  it("averages correctly", () => {
    expect(averageRating([{ rating: 5 }, { rating: 7 }, { rating: 9 }])).toBe(7);
  });
});

describe("ratingLabel", () => {
  it("maps ranges to labels", () => {
    expect(ratingLabel(10)).toBe("Show de bola");
    expect(ratingLabel(7)).toBe("Foi muito bem");
    expect(ratingLabel(5)).toBe("Mediano");
    expect(ratingLabel(3)).toBe("Apagado");
    expect(ratingLabel(0)).toBe("Quebrou o time");
  });
});
