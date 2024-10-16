CREATE TABLE IF NOT EXISTS "Firm" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"user_name" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Firm" ADD CONSTRAINT "Firm_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
