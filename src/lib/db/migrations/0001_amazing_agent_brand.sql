-- Add inviteToken in 3 steps to backfill existing peladas safely:
-- 1) nullable column, 2) backfill with random UUIDs, 3) enforce NOT NULL + UNIQUE.
ALTER TABLE "pelada" ADD COLUMN "inviteToken" text;--> statement-breakpoint
UPDATE "pelada" SET "inviteToken" = gen_random_uuid()::text WHERE "inviteToken" IS NULL;--> statement-breakpoint
ALTER TABLE "pelada" ALTER COLUMN "inviteToken" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "pelada" ADD CONSTRAINT "pelada_inviteToken_unique" UNIQUE("inviteToken");
