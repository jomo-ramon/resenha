# `components/domain/`

Domain-aware components — know about our entities.

Examples:
- `match-card.tsx` — receives a `Match`, renders its summary
- `player-avatar.tsx` — receives a `Membership`, renders avatar + name
- `team-badge.tsx` — receives a `Team`, renders colored chip

These compose `components/ui/` primitives plus domain types from `lib/domain/`.

Naming: `kebab-case.tsx`.
