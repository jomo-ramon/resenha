-- Data migration: collapse the legacy "referee" membership role into "player".
--
-- Refereeing is now per-match (see matches.activeRefereeId) — the role on
-- membership no longer needs a separate value. Existing rows that were
-- "referee" become regular players; the admin can still pick them as the
-- juiz of any individual match.
UPDATE "membership" SET "role" = 'player' WHERE "role" = 'referee';
