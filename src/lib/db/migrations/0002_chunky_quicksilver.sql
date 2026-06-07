CREATE TABLE "playerRating" (
	"id" text PRIMARY KEY NOT NULL,
	"matchId" text NOT NULL,
	"membershipId" text NOT NULL,
	"rating" integer NOT NULL,
	"notes" text,
	"ratedByMembershipId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "playerRating_matchId_membershipId_unique" UNIQUE("matchId","membershipId")
);
--> statement-breakpoint
ALTER TABLE "playerRating" ADD CONSTRAINT "playerRating_matchId_match_id_fk" FOREIGN KEY ("matchId") REFERENCES "public"."match"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playerRating" ADD CONSTRAINT "playerRating_membershipId_membership_id_fk" FOREIGN KEY ("membershipId") REFERENCES "public"."membership"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playerRating" ADD CONSTRAINT "playerRating_ratedByMembershipId_membership_id_fk" FOREIGN KEY ("ratedByMembershipId") REFERENCES "public"."membership"("id") ON DELETE restrict ON UPDATE no action;