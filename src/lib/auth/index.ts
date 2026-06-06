/**
 * Auth.js v5 configuration.
 *
 * Exports the `auth()` helper (used in Server Components, Server Actions,
 * Route Handlers) and `handlers` (mounted at /api/auth/[...nextauth]).
 *
 * Providers:
 *   - Google OAuth (env: AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET)
 *   - Resend magic link (env: AUTH_RESEND_KEY, AUTH_EMAIL_FROM)
 *
 * Session strategy: database (Auth.js sessions table via DrizzleAdapter).
 *
 * See ARCHITECTURE.md §4 and AGENTS.md.
 */

import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { db } from "@/lib/db/client";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema/auth";

// Fallbacks keep build (Vercel, CI) from crashing when secrets are absent —
// at runtime the providers will simply fail on first use, which is the right
// behavior for a missing-config error.
const resendApiKey = process.env.AUTH_RESEND_KEY ?? "";
const emailFrom = process.env.AUTH_EMAIL_FROM ?? "Auth.js <no-reply@authjs.dev>";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [Google, Resend({ apiKey: resendApiKey, from: emailFrom })],
  session: { strategy: "database" },
  pages: {
    signIn: "/entrar",
  },
  // Required when running behind Vercel's proxy without explicit AUTH_URL on
  // every preview deploy. We do set AUTH_URL in production env vars; this just
  // avoids surprises on preview/dev.
  trustHost: true,
});
