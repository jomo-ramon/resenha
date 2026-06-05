# `lib/auth/`

Auth.js (NextAuth v5) configuration.

Planned files:
- `index.ts` — main config, providers, callbacks
- `helpers.ts` — `getCurrentUser()`, `requireAuth()` wrappers

Providers (F1):
- Google OAuth
- Email magic link (Resend or SMTP)
- Invite token (custom credential)

See `WIREFRAMES_F1.md` §2.2 for the invite flow.
