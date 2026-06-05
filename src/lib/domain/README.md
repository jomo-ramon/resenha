# `lib/domain/`

Pure business logic — the soul of the product.

## Strict rules

- **NEVER** imports from `lib/db/`, Next.js, Auth.js, or anything framework-specific.
- Functions receive plain data (DTOs) and return plain data or `Result<T, E>`.
- Easy to unit-test in isolation (no DB mocks needed).
- 100% coverage target.

## Modules planned

| File | Purpose | Phase |
|---|---|---|
| `team-draft.ts` | Algorithms: random, captains-pick, balanced (F2) | F1 |
| `ranking.ts` | Calculate top scorers, average ratings, win % | F1 |
| `match-state-machine.ts` | Valid status transitions for `Match` | F1 |
| `roster-rules.ts` | Auto-promotion from waitlist; max players check | F1 |
| `match-event-rules.ts` | 24h edit window, audit triggers | F1 |
| `fantasy-scoring.ts` | Cartola-style point calculation | F3 |
| `achievements/` | Badge unlock evaluators (one file per achievement) | F3 |

See `ARCHITECTURE.md` §5.4 for business rules these enforce.
