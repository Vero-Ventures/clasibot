/**
 * Defines the shape of the categorized result object.
 * Makes use of the Category type defined in Category.ts.
 */
import type { Category } from './Category';

// Defines the shape of the categorized result object.
export type CategorizedResult = {
  // transaction_ID: whole number as a string.
  transaction_ID: string;
  // A list of possible categories the transaction could be classified as.
  possibleCategories: Category[];
  // The method of classification:
  // Fuzzy or Exact Match by Fuse, Database Lookup, or LLM
  classifiedBy: string;
};
