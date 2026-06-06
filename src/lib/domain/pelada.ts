/**
 * Pelada domain — pure validation + invariants. NO Drizzle, NO Next, NO Auth.
 *
 * Schemas are shared between Server Actions (boundary validation) and forms
 * (React Hook Form resolver). Single source of truth for what's valid input.
 */

import { z } from "zod";

const RESERVED_SLUGS = new Set([
  "api",
  "app",
  "auth",
  "cadastro",
  "entrar",
  "nova-pelada",
  "p",
  "peladas",
  "perfil",
]);

export const slugSchema = z
  .string()
  .min(3, "O endereço da pelada precisa ter pelo menos 3 caracteres.")
  .max(40, "O endereço da pelada não pode passar de 40 caracteres.")
  .regex(/^[a-z0-9-]+$/, "Só letras minúsculas, números e hífens.")
  .refine((s) => !s.startsWith("-") && !s.endsWith("-"), {
    message: "Não pode começar nem terminar com hífen.",
  })
  .refine((s) => !s.includes("--"), {
    message: "Não pode ter dois hífens seguidos.",
  })
  .refine((s) => !RESERVED_SLUGS.has(s), {
    message: "Esse endereço é reservado pelo sistema. Escolhe outro.",
  });

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const weekdaySchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export const createPeladaInputSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto.").max(60, "Nome muito longo."),
  slug: slugSchema,
  description: z.string().trim().max(280, "Descrição muito longa.").optional().or(z.literal("")),
  weekday: weekdaySchema,
  startTime: z.string().regex(TIME_REGEX, "Use formato HH:MM (ex: 16:00)."),
  location: z
    .string()
    .trim()
    .min(2, "Onde rola a pelada? Pelo menos 2 letras.")
    .max(120, "Local muito longo."),
  address: z.string().trim().max(200, "Endereço muito longo.").optional().or(z.literal("")),
  maxPlayers: z.coerce
    .number()
    .int("Tem que ser um número inteiro.")
    .min(4, "Pelo menos 4 jogadores.")
    .max(100, "Máximo 100 jogadores."),
});

export type CreatePeladaInput = z.infer<typeof createPeladaInputSchema>;

/**
 * Converts a free-form pelada name into a URL-safe slug suggestion.
 * E.g. "Cornetas FC" → "cornetas-fc", "Pelada do João" → "pelada-do-joao".
 *
 * Pure helper — UI uses this to pre-fill the slug field while the user types.
 * The final slug is validated server-side via slugSchema regardless.
 */
export function suggestSlugFromName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
