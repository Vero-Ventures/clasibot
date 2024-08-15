CREATE TABLE IF NOT EXISTS "Classification" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text,
	"count" integer,
	CONSTRAINT "Classification_category_unique" UNIQUE("category")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Subscription" (
	"id" text PRIMARY KEY DEFAULT 'kbxqf23qz9bq1273iqfkjhh6' NOT NULL,
	"userId" text,
	"stripeId" text,
	CONSTRAINT "Subscription_userId_unique" UNIQUE("userId"),
	CONSTRAINT "Subscription_stripeId_unique" UNIQUE("stripeId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "TransactionClassification" (
	"id" serial PRIMARY KEY NOT NULL,
	"transactionName" text,
	"classifications" text[],
	CONSTRAINT "TransactionClassification_transactionName_unique" UNIQUE("transactionName")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "User" (
	"id" text PRIMARY KEY DEFAULT 'r1c2u7vp9x46nbop1ine0u3y' NOT NULL,
	"first_name" text,
	"last_name" text,
	"email" text,
	"industry" text,
	"subscriptionId" text,
	CONSTRAINT "User_email_unique" UNIQUE("email"),
	CONSTRAINT "User_subscriptionId_unique" UNIQUE("subscriptionId")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "TransactionClassification" ADD CONSTRAINT "TransactionClassification_classifications_Classification_id_fk" FOREIGN KEY ("classifications") REFERENCES "public"."Classification"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "User" ADD CONSTRAINT "User_subscriptionId_Subscription_id_fk" FOREIGN KEY ("subscriptionId") REFERENCES "public"."Subscription"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
