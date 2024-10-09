CREATE TABLE IF NOT EXISTS "ForReviewTransaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"transaction_id" text NOT NULL,
	"account_id" text NOT NULL,
	"description" text,
	"orig_description" text,
	"amount" integer NOT NULL,
	"date" text NOT NULL,
	"payee_name_id" text,
	"transaction_type_id" text NOT NULL,
	"approved" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ForReviewTransactionsToClassifications" (
	"transaction_id" uuid NOT NULL,
	"classification_id" integer NOT NULL,
	CONSTRAINT "ForReviewTransactionsToClassifications_transaction_id_classification_id_pk" PRIMARY KEY("transaction_id","classification_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ForReviewTransactionsToTaxCodes" (
	"transaction_id" uuid NOT NULL,
	"tax_code_id" integer NOT NULL,
	CONSTRAINT "ForReviewTransactionsToTaxCodes_transaction_id_tax_code_id_pk" PRIMARY KEY("transaction_id","tax_code_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ForReviewTransaction" ADD CONSTRAINT "ForReviewTransaction_company_id_Company_realm_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."Company"("realm_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ForReviewTransactionsToClassifications" ADD CONSTRAINT "ForReviewTransactionsToClassifications_transaction_id_ForReviewTransaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."ForReviewTransaction"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ForReviewTransactionsToClassifications" ADD CONSTRAINT "ForReviewTransactionsToClassifications_classification_id_Classification_id_fk" FOREIGN KEY ("classification_id") REFERENCES "public"."Classification"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ForReviewTransactionsToTaxCodes" ADD CONSTRAINT "ForReviewTransactionsToTaxCodes_transaction_id_ForReviewTransaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."ForReviewTransaction"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ForReviewTransactionsToTaxCodes" ADD CONSTRAINT "ForReviewTransactionsToTaxCodes_tax_code_id_TaxCode_id_fk" FOREIGN KEY ("tax_code_id") REFERENCES "public"."TaxCode"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
