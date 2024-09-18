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
CREATE TABLE IF NOT EXISTS "classifiedUserTransaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"qboID" text NOT NULL,
	"classificationId" serial[] NOT NULL,
	"taxCodeId" serial[] NOT NULL,
	CONSTRAINT "classifiedUserTransaction_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unclassifiedUserTransaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"qboID" text NOT NULL,
	"classificationId" serial[],
	"taxCodeId" serial[],
	CONSTRAINT "unclassifiedUserTransaction_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "companyNames" text[];--> statement-breakpoint
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
 ALTER TABLE "classifiedUserTransaction" ADD CONSTRAINT "classifiedUserTransaction_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "classifiedUserTransaction" ADD CONSTRAINT "classifiedUserTransaction_classificationId_Classification_id_fk" FOREIGN KEY ("classificationId") REFERENCES "public"."Classification"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "classifiedUserTransaction" ADD CONSTRAINT "classifiedUserTransaction_taxCodeId_TaxCode_id_fk" FOREIGN KEY ("taxCodeId") REFERENCES "public"."TaxCode"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unclassifiedUserTransaction" ADD CONSTRAINT "unclassifiedUserTransaction_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unclassifiedUserTransaction" ADD CONSTRAINT "unclassifiedUserTransaction_classificationId_Classification_id_fk" FOREIGN KEY ("classificationId") REFERENCES "public"."Classification"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unclassifiedUserTransaction" ADD CONSTRAINT "unclassifiedUserTransaction_taxCodeId_TaxCode_id_fk" FOREIGN KEY ("taxCodeId") REFERENCES "public"."TaxCode"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
