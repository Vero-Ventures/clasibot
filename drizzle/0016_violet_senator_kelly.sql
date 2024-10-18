ALTER TABLE "Category" RENAME COLUMN "count" TO "matches";--> statement-breakpoint
ALTER TABLE "TaxCode" RENAME COLUMN "count" TO "matches";--> statement-breakpoint
ALTER TABLE "Firm" ADD CONSTRAINT "Firm_user_id_unique" UNIQUE("user_id");