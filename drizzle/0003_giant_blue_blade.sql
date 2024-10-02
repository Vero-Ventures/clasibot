CREATE TABLE IF NOT EXISTS "Company" (
	"id" uuid PRIMARY KEY NOT NULL,
	"realm_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"industry" text,
	"bookkeeper_connected" boolean NOT NULL,
	CONSTRAINT "Company_realm_id_unique" UNIQUE("realm_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "TaxCode" (
	"id" serial PRIMARY KEY NOT NULL,
	"taxCode" text NOT NULL,
	"count" integer NOT NULL,
	CONSTRAINT "TaxCode_taxCode_unique" UNIQUE("taxCode")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "TransactionsToTaxCodes" (
	"transaction_id" integer NOT NULL,
	"tax_code_id" integer NOT NULL,
	CONSTRAINT "TransactionsToTaxCodes_transaction_id_tax_code_id_pk" PRIMARY KEY("transaction_id","tax_code_id")
);
--> statement-breakpoint
ALTER TABLE "Subscription" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "Subscription" ALTER COLUMN "stripe_id" SET DATA TYPE text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Company" ADD CONSTRAINT "Company_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "TransactionsToTaxCodes" ADD CONSTRAINT "TransactionsToTaxCodes_transaction_id_Transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."Transaction"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "TransactionsToTaxCodes" ADD CONSTRAINT "TransactionsToTaxCodes_tax_code_id_TaxCode_id_fk" FOREIGN KEY ("tax_code_id") REFERENCES "public"."TaxCode"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN IF EXISTS "industry";