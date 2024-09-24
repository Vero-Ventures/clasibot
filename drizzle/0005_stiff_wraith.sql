CREATE TABLE IF NOT EXISTS "Company" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"industry" text,
	"connected" boolean NOT NULL
);
--> statement-breakpoint
ALTER TABLE "userTransaction" DROP CONSTRAINT "userTransaction_user_id_unique";--> statement-breakpoint
ALTER TABLE "userTransaction" DROP CONSTRAINT "userTransaction_user_id_User_id_fk";
--> statement-breakpoint
ALTER TABLE "userTransaction" ADD COLUMN "company_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "userTransaction" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "userTransaction" ADD COLUMN "date" text NOT NULL;--> statement-breakpoint
ALTER TABLE "userTransaction" ADD COLUMN "account" text NOT NULL;--> statement-breakpoint
ALTER TABLE "userTransaction" ADD COLUMN "amount" text NOT NULL;--> statement-breakpoint
ALTER TABLE "userTransaction" ADD COLUMN "approved" boolean NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Company" ADD CONSTRAINT "Company_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userTransaction" ADD CONSTRAINT "userTransaction_company_id_Company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."Company"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN IF EXISTS "industry";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN IF EXISTS "companyNames";--> statement-breakpoint
ALTER TABLE "userTransaction" DROP COLUMN IF EXISTS "user_id";