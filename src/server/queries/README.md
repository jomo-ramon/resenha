# `server/queries/`

Typed read-only queries for use in Server Components.

Like actions, must:
1. Authenticate the user
2. Scope by `peladaId` from `getPeladaContext()`

Distinct from `lib/db/repositories/` — those are pure data access. Queries here
add tenant guard + composition.

Naming: `kebab-case.ts`.
