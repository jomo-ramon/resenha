/**
 * Drizzle client singleton.
 *
 * Uses Postgres.js as the driver. The Supabase transaction pooler (port 6543)
 * is set in DATABASE_URL — that's required for Vercel serverless to avoid
 * exhausting connection limits.
 *
 * In dev we cache the underlying client on globalThis to survive HMR.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

type GlobalForDb = { __resenhaPgClient?: ReturnType<typeof postgres> };
const globalForDb = globalThis as unknown as GlobalForDb;

// Supabase pooled connections in transaction mode don't support prepared
// statements — disable prefetch to avoid "prepared statement already exists" errors.
const pgClient = globalForDb.__resenhaPgClient ?? postgres(databaseUrl, { prepare: false });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__resenhaPgClient = pgClient;
}

export const db = drizzle(pgClient, { schema });

export type Db = typeof db;
