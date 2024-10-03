CREATE TABLE IF NOT EXISTS "Category" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"count" integer NOT NULL,
	CONSTRAINT "Category_category_unique" UNIQUE("category")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ForReviewTransactionsToCategories" (
	"transaction_id" uuid NOT NULL,
	"category_id" integer NOT NULL,
	CONSTRAINT "ForReviewTransactionsToCategories_transaction_id_category_id_pk" PRIMARY KEY("transaction_id","category_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "TransactionsToCategories" (
	"transaction_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	CONSTRAINT "TransactionsToCategories_transaction_id_category_id_pk" PRIMARY KEY("transaction_id","category_id")
);
DO $$ BEGIN
 ALTER TABLE "ForReviewTransactionsToCategories" ADD CONSTRAINT "ForReviewTransactionsToCategories_transaction_id_ForReviewTransaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."ForReviewTransaction"("id") ON DELETE no action ON UPDATE no action;
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
