ALTER TABLE "Classification" ALTER COLUMN "category" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "Classification" ALTER COLUMN "count" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "Subscription" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "Subscription" ALTER COLUMN "stripe_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "Transaction" ALTER COLUMN "transaction_name" SET NOT NULL;