# `lib/db/repositories/`

Encapsulated database access — reusable, complex queries that don't fit a
single Server Action.

Pattern: pure functions taking the Drizzle client + parameters, returning typed
domain objects.

Example: `match-repository.ts` exposes `findUpcomingMatchesForPelada(peladaId)`,
`findFinishedMatchesWithScore(peladaId, year)`, etc.

Skip the repository when a query is used in a single place — call Drizzle
directly from the Server Action/query.
