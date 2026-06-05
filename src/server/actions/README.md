# `server/actions/`

Server Actions — mutations exposed to client components.

Every action MUST:
1. Validate input with Zod
2. Authenticate via Auth.js helpers
3. Authorize via `getPeladaContext(slug)` from `lib/multitenancy.ts`
4. Call domain logic from `lib/domain/`
5. Persist via `lib/db/`
6. Revalidate paths/tags as needed

See `CODING_STANDARDS.md` §6.2 and `ARCHITECTURE.md` §6.3.

Naming: `kebab-case.ts` grouped by entity (`match/create-match.ts`, etc.).
