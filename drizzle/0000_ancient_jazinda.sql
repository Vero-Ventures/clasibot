CREATE TABLE IF NOT EXISTS "Classification" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text,
	"count" integer,
	CONSTRAINT "Classification_category_unique" UNIQUE("category")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"stripe_id" uuid,
	CONSTRAINT "Subscription_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "Subscription_stripe_id_unique" UNIQUE("stripe_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Transaction" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_name" text,
	CONSTRAINT "Transaction_transaction_name_unique" UNIQUE("transaction_name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "TransactionsToClassifications" (
	"transaction_id" integer NOT NULL,
	"classification_id" integer NOT NULL,
	CONSTRAINT "TransactionsToClassifications_transaction_id_classification_id_pk" PRIMARY KEY("transaction_id","classification_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "User" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text,
	"last_name" text,
	"email" text,
	"industry" text,
	"subscription_id" uuid,
	CONSTRAINT "User_email_unique" UNIQUE("email"),
	CONSTRAINT "User_subscription_id_unique" UNIQUE("subscription_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "TransactionsToClassifications" ADD CONSTRAINT "TransactionsToClassifications_transaction_id_Transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."Transaction"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "TransactionsToClassifications" ADD CONSTRAINT "TransactionsToClassifications_classification_id_Classification_id_fk" FOREIGN KEY ("classification_id") REFERENCES "public"."Classification"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "User" ADD CONSTRAINT "User_subscription_id_Subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."Subscription"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
