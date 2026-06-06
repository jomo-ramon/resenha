/**
 * Barrel re-export of all Drizzle schemas.
 *
 * Imported by `lib/db/client.ts` so `db.query.<tableName>` is fully typed.
 * Imported by `drizzle.config.ts` (via the schema glob) for migrations.
 */

export * from "./auth";
export * from "./matches";
export * from "./peladas";
