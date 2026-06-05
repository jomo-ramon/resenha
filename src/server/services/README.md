# `server/services/`

Orchestration layer — composes multiple actions/queries when needed.

Example: `match-service.ts` handles `finalize()`, which:
1. Updates `Match.status → finished`
2. Sets `Match.finishedAt = now()`
3. Releases referee lock
4. Triggers waitlist-related cleanup
5. Computes and caches final score

Reserve services for flows that span multiple entities or have non-trivial
transactional needs.

Naming: `kebab-case.ts`.
