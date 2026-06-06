import { describe, expect, it } from "vitest";
import {
  type CreatePeladaInput,
  createPeladaInputSchema,
  slugSchema,
  suggestSlugFromName,
} from "./pelada";

describe("slugSchema", () => {
  it("accepts kebab-case lowercase alphanumerics", () => {
    expect(slugSchema.safeParse("cornetas").success).toBe(true);
    expect(slugSchema.safeParse("pelada-do-joao").success).toBe(true);
    expect(slugSchema.safeParse("time-2024").success).toBe(true);
  });

  it("rejects uppercase, spaces and special chars", () => {
    expect(slugSchema.safeParse("Cornetas").success).toBe(false);
    expect(slugSchema.safeParse("pelada do joao").success).toBe(false);
    expect(slugSchema.safeParse("pelada_do_joao").success).toBe(false);
    expect(slugSchema.safeParse("pelada!").success).toBe(false);
  });

  it("rejects slugs shorter than 3 or longer than 40 chars", () => {
    expect(slugSchema.safeParse("ab").success).toBe(false);
    expect(slugSchema.safeParse("a".repeat(41)).success).toBe(false);
  });

  it("rejects leading, trailing and double hyphens", () => {
    expect(slugSchema.safeParse("-cornetas").success).toBe(false);
    expect(slugSchema.safeParse("cornetas-").success).toBe(false);
    expect(slugSchema.safeParse("cor--netas").success).toBe(false);
  });

  it("rejects reserved system slugs", () => {
    expect(slugSchema.safeParse("api").success).toBe(false);
    expect(slugSchema.safeParse("peladas").success).toBe(false);
    expect(slugSchema.safeParse("entrar").success).toBe(false);
    expect(slugSchema.safeParse("nova-pelada").success).toBe(false);
  });
});

describe("suggestSlugFromName", () => {
  it("strips diacritics and lowercases", () => {
    expect(suggestSlugFromName("Pelada do João")).toBe("pelada-do-joao");
    expect(suggestSlugFromName("Atlético Mineirão")).toBe("atletico-mineirao");
  });

  it("collapses non-alphanumerics into single hyphens", () => {
    expect(suggestSlugFromName("Cornetas FC")).toBe("cornetas-fc");
    expect(suggestSlugFromName("Time !! 2024")).toBe("time-2024");
  });

  it("trims leading and trailing hyphens", () => {
    expect(suggestSlugFromName("-cornetas-")).toBe("cornetas");
    expect(suggestSlugFromName("!!! cornetas !!!")).toBe("cornetas");
  });

  it("caps at 40 characters", () => {
    const longName = "a".repeat(60);
    expect(suggestSlugFromName(longName).length).toBe(40);
  });

  it("produces a slug that passes slugSchema for typical inputs", () => {
    const inputs = ["Cornetas", "Pelada do João", "Atlético FC 2024"];
    for (const input of inputs) {
      const slug = suggestSlugFromName(input);
      expect(slugSchema.safeParse(slug).success).toBe(true);
    }
  });
});

describe("createPeladaInputSchema", () => {
  const validInput: CreatePeladaInput = {
    name: "Cornetas",
    slug: "cornetas",
    weekday: "saturday",
    startTime: "16:00",
    location: "Campo do Bairro",
    maxPlayers: 20,
  };

  it("accepts a minimally valid pelada", () => {
    expect(createPeladaInputSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejects an invalid startTime format", () => {
    expect(createPeladaInputSchema.safeParse({ ...validInput, startTime: "25:00" }).success).toBe(
      false,
    );
    expect(createPeladaInputSchema.safeParse({ ...validInput, startTime: "9:00" }).success).toBe(
      false,
    );
    expect(createPeladaInputSchema.safeParse({ ...validInput, startTime: "16h00" }).success).toBe(
      false,
    );
  });

  it("rejects out-of-range maxPlayers", () => {
    expect(createPeladaInputSchema.safeParse({ ...validInput, maxPlayers: 3 }).success).toBe(false);
    expect(createPeladaInputSchema.safeParse({ ...validInput, maxPlayers: 101 }).success).toBe(
      false,
    );
  });

  it("coerces maxPlayers from a numeric string (form input)", () => {
    const result = createPeladaInputSchema.safeParse({
      ...validInput,
      maxPlayers: "20" as unknown as number,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.maxPlayers).toBe(20);
  });

  it("accepts empty optional description and address", () => {
    const result = createPeladaInputSchema.safeParse({
      ...validInput,
      description: "",
      address: "",
    });
    expect(result.success).toBe(true);
  });
});
