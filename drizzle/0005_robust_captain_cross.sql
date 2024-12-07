ALTER TABLE "TaxCode" RENAME COLUMN "taxCode" TO "tax_code";--> statement-breakpoint
ALTER TABLE "TaxCode" DROP CONSTRAINT "TaxCode_taxCode_unique";--> statement-breakpoint
ALTER TABLE "TaxCode" ADD CONSTRAINT "TaxCode_tax_code_unique" UNIQUE("tax_code");