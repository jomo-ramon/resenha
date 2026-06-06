CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "membership" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"peladaId" text NOT NULL,
	"role" text DEFAULT 'player' NOT NULL,
	"nickname" text,
	"shirtNumber" integer,
	"preferredPosition" text DEFAULT 'outfield' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "membership_userId_peladaId_unique" UNIQUE("userId","peladaId")
);
--> statement-breakpoint
CREATE TABLE "pelada" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"logoUrl" text,
	"sport" text DEFAULT 'football' NOT NULL,
	"weekday" text NOT NULL,
	"startTime" text NOT NULL,
	"location" text NOT NULL,
	"address" text,
	"maxPlayers" integer DEFAULT 20 NOT NULL,
	"rules" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ownerUserId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pelada_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "matchEvent" (
	"id" text PRIMARY KEY NOT NULL,
	"matchId" text NOT NULL,
	"teamId" text NOT NULL,
	"membershipId" text NOT NULL,
	"type" text NOT NULL,
	"minute" integer,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match" (
	"id" text PRIMARY KEY NOT NULL,
	"peladaId" text NOT NULL,
	"scheduledFor" timestamp with time zone NOT NULL,
	"locationOverride" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"activeRefereeId" text,
	"finishedAt" timestamp with time zone,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rosterEntry" (
	"id" text PRIMARY KEY NOT NULL,
	"matchId" text NOT NULL,
	"membershipId" text NOT NULL,
	"status" text NOT NULL,
	"listPosition" integer NOT NULL,
	"respondedAt" timestamp DEFAULT now() NOT NULL,
	"promotedFromWaitlistAt" timestamp,
	CONSTRAINT "rosterEntry_matchId_membershipId_unique" UNIQUE("matchId","membershipId")
);
--> statement-breakpoint
CREATE TABLE "teamPlayer" (
	"id" text PRIMARY KEY NOT NULL,
	"teamId" text NOT NULL,
	"membershipId" text NOT NULL,
	CONSTRAINT "teamPlayer_teamId_membershipId_unique" UNIQUE("teamId","membershipId")
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" text PRIMARY KEY NOT NULL,
	"matchId" text NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"captainMembershipId" text NOT NULL,
	"finalScore" integer
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_peladaId_pelada_id_fk" FOREIGN KEY ("peladaId") REFERENCES "public"."pelada"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelada" ADD CONSTRAINT "pelada_ownerUserId_user_id_fk" FOREIGN KEY ("ownerUserId") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchEvent" ADD CONSTRAINT "matchEvent_matchId_match_id_fk" FOREIGN KEY ("matchId") REFERENCES "public"."match"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchEvent" ADD CONSTRAINT "matchEvent_teamId_team_id_fk" FOREIGN KEY ("teamId") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchEvent" ADD CONSTRAINT "matchEvent_membershipId_membership_id_fk" FOREIGN KEY ("membershipId") REFERENCES "public"."membership"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_peladaId_pelada_id_fk" FOREIGN KEY ("peladaId") REFERENCES "public"."pelada"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_activeRefereeId_membership_id_fk" FOREIGN KEY ("activeRefereeId") REFERENCES "public"."membership"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rosterEntry" ADD CONSTRAINT "rosterEntry_matchId_match_id_fk" FOREIGN KEY ("matchId") REFERENCES "public"."match"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rosterEntry" ADD CONSTRAINT "rosterEntry_membershipId_membership_id_fk" FOREIGN KEY ("membershipId") REFERENCES "public"."membership"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teamPlayer" ADD CONSTRAINT "teamPlayer_teamId_team_id_fk" FOREIGN KEY ("teamId") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teamPlayer" ADD CONSTRAINT "teamPlayer_membershipId_membership_id_fk" FOREIGN KEY ("membershipId") REFERENCES "public"."membership"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_matchId_match_id_fk" FOREIGN KEY ("matchId") REFERENCES "public"."match"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_captainMembershipId_membership_id_fk" FOREIGN KEY ("captainMembershipId") REFERENCES "public"."membership"("id") ON DELETE restrict ON UPDATE no action;