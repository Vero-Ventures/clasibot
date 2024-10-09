CREATE TABLE IF NOT EXISTS "NextReviewDateTime" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ForReviewTransaction" DROP COLUMN IF EXISTS "approved";