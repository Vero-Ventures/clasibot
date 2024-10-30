ALTER TABLE "ForReviewTransaction" RENAME COLUMN "transaction_id" TO "review_transaction_id";--> statement-breakpoint
ALTER TABLE "ForReviewTransactionsToCategories" RENAME COLUMN "transaction_id" TO "review_transaction_id";--> statement-breakpoint
ALTER TABLE "ForReviewTransactionsToTaxCodes" RENAME COLUMN "transaction_id" TO "review_transaction_id";--> statement-breakpoint
ALTER TABLE "User" RENAME COLUMN "first_name" TO "user_name";--> statement-breakpoint
ALTER TABLE "ForReviewTransactionsToCategories" DROP CONSTRAINT "ForReviewTransactionsToCategories_transaction_id_ForReviewTransaction_id_fk";
--> statement-breakpoint
ALTER TABLE "ForReviewTransactionsToTaxCodes" DROP CONSTRAINT "ForReviewTransactionsToTaxCodes_transaction_id_ForReviewTransaction_id_fk";
--> statement-breakpoint
ALTER TABLE "ForReviewTransactionsToCategories" DROP CONSTRAINT "ForReviewTransactionsToCategories_transaction_id_category_id_pk";--> statement-breakpoint
ALTER TABLE "ForReviewTransactionsToTaxCodes" DROP CONSTRAINT "ForReviewTransactionsToTaxCodes_transaction_id_tax_code_id_pk";--> statement-breakpoint
ALTER TABLE "ForReviewTransactionsToCategories" ADD CONSTRAINT "ForReviewTransactionsToCategories_review_transaction_id_category_id_pk" PRIMARY KEY("review_transaction_id","category_id");--> statement-breakpoint
ALTER TABLE "ForReviewTransactionsToTaxCodes" ADD CONSTRAINT "ForReviewTransactionsToTaxCodes_review_transaction_id_tax_code_id_pk" PRIMARY KEY("review_transaction_id","tax_code_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ForReviewTransactionsToCategories" ADD CONSTRAINT "ForReviewTransactionsToCategories_review_transaction_id_ForReviewTransaction_id_fk" FOREIGN KEY ("review_transaction_id") REFERENCES "public"."ForReviewTransaction"("id") ON DELETE no action ON UPDATE no action;
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
ALTER TABLE "Company" DROP COLUMN IF EXISTS "industry";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN IF EXISTS "last_name";