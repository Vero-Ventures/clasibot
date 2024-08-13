/**
 * Defines method to filter to categorized and uncategorized transactions.
 * Used by the home page tables to display the appropriate transactions.
 */
import type { Transaction } from '@/types/Transaction';

// Takes and returns a list of transaction objects.
export const filterUncategorized = (
  purchases: Transaction[]
): Transaction[] => {
  // Filter out all transactions that do not have uncategorized in the category field text.
  // Return the filtered list of transactions.
  return purchases.filter((purchase: Transaction) =>
    purchase.category.toLowerCase().includes('uncategor')
  );
};

export const filterCategorized = (purchases: Transaction[]): Transaction[] => {
  // Filter out all transactions that have uncategorized in the category field text.
  // Return the filtered list of transactions.
  return purchases.filter(
    (purchase: Transaction) =>
      !purchase.category.toLowerCase().includes('uncategor')
  );
};
