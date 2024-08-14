/**
 * Defines the format of the categorized result object.
 * Makes use of the Category type defined in Category.ts.
 */
import type { Category } from './Category';

export type CategorizedResult = {
  // transaction_ID: Whole number as a string.
  transaction_ID: string;
  // A list of possible categories the transaction could be classified as.
  possibleCategories: Category[];
  // The method of classification:
  // 'Matching', 'Database', or 'LLM'
  classifiedBy: string;
};
