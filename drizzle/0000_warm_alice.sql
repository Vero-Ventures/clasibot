CREATE TABLE IF NOT EXISTS "Category" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"matches" integer NOT NULL,
	CONSTRAINT "Category_category_unique" UNIQUE("category")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Company" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"realm_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"firm_name" text,
	"bookkeeper_connected" boolean NOT NULL,
	CONSTRAINT "Company_realm_id_unique" UNIQUE("realm_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Firm" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"user_id" uuid,
	"user_name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ForReviewTransaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"review_transaction_id" text NOT NULL,
	"account_id" text NOT NULL,
	"description" text NOT NULL,
	"orig_description" text NOT NULL,
	"date" text NOT NULL,
	"amount" numeric NOT NULL,
	"accept_type" text NOT NULL,
	"transaction_type_id" text NOT NULL,
	"payee_name_id" text,
	"top_category_classification" text NOT NULL,
	"top_tax_code_classification" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ForReviewTransactionsToCategories" (
	"review_transaction_id" uuid NOT NULL,
	"category_id" integer NOT NULL,
	CONSTRAINT "ForReviewTransactionsToCategories_review_transaction_id_category_id_pk" PRIMARY KEY("review_transaction_id","category_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ForReviewTransactionsToTaxCodes" (
	"review_transaction_id" uuid NOT NULL,
	"tax_code_id" integer NOT NULL,
	CONSTRAINT "ForReviewTransactionsToTaxCodes_review_transaction_id_tax_code_id_pk" PRIMARY KEY("review_transaction_id","tax_code_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stripe_id" text,
	CONSTRAINT "Subscription_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "Subscription_stripe_id_unique" UNIQUE("stripe_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "TaxCode" (
	"id" serial PRIMARY KEY NOT NULL,
	"tax_code" text NOT NULL,
	"matches" integer NOT NULL,
	CONSTRAINT "TaxCode_tax_code_unique" UNIQUE("tax_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Transaction" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_name" text NOT NULL,
	CONSTRAINT "Transaction_transaction_name_unique" UNIQUE("transaction_name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "TransactionsToCategories" (
	"transaction_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	CONSTRAINT "TransactionsToCategories_transaction_id_category_id_pk" PRIMARY KEY("transaction_id","category_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "TransactionsToTaxCodes" (
	"transaction_id" integer NOT NULL,
	"tax_code_id" integer NOT NULL,
	CONSTRAINT "TransactionsToTaxCodes_transaction_id_tax_code_id_pk" PRIMARY KEY("transaction_id","tax_code_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "User" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_name" text,
	"email" text NOT NULL,
	"subscription_id" uuid,
	CONSTRAINT "User_email_unique" UNIQUE("email"),
	CONSTRAINT "User_subscription_id_unique" UNIQUE("subscription_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Company" ADD CONSTRAINT "Company_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Firm" ADD CONSTRAINT "Firm_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ForReviewTransaction" ADD CONSTRAINT "ForReviewTransaction_company_id_Company_realm_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."Company"("realm_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ForReviewTransactionsToCategories" ADD CONSTRAINT "ForReviewTransactionsToCategories_review_transaction_id_ForReviewTransaction_id_fk" FOREIGN KEY ("review_transaction_id") REFERENCES "public"."ForReviewTransaction"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ForReviewTransactionsToCategories" ADD CONSTRAINT "ForReviewTransactionsToCategories_category_id_Category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."Category"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ForReviewTransactionsToTaxCodes" ADD CONSTRAINT "ForReviewTransactionsToTaxCodes_review_transaction_id_ForReviewTransaction_id_fk" FOREIGN KEY ("review_transaction_id") REFERENCES "public"."ForReviewTransaction"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ForReviewTransactionsToTaxCodes" ADD CONSTRAINT "ForReviewTransactionsToTaxCodes_tax_code_id_TaxCode_id_fk" FOREIGN KEY ("tax_code_id") REFERENCES "public"."TaxCode"("id") ON DELETE no action ON UPDATE no action;
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
DO $$ BEGIN
 ALTER TABLE "TransactionsToCategories" ADD CONSTRAINT "TransactionsToCategories_transaction_id_Transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."Transaction"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "TransactionsToCategories" ADD CONSTRAINT "TransactionsToCategories_category_id_Category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."Category"("id") ON DELETE no action ON UPDATE no action;
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
