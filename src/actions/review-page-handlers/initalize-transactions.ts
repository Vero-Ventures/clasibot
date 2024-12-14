'use server';

import type {
  RawForReviewTransaction,
  ClassifiedForReviewTransaction,
  ClassifiedElement,
} from '@/types/index';

// Takes: The loaded 'For Review' transactions.
// Returns: The record of selected Classifications as well as the list of unique Account names.
export async function initalizeLoadedTransactions(
  loadedTransactions: (
    | ClassifiedForReviewTransaction
    | RawForReviewTransaction
  )[][]
): Promise<{
  categoryRecord: Record<string, string>;
  taxCodeRecord: Record<string, string>;
  accountsList: string[];
}> {
  // Create a set to track Account names without duplicates, then add all Account names to the set.
  const accountNames = new Set<string>();
  for (const transaction of loadedTransactions) {
    const formattedTransaction =
      transaction[0] as ClassifiedForReviewTransaction;
    accountNames.add(formattedTransaction.accountName);
  }

  // Define the list of Accounts from the Account names set.
  const foundAccounts = Array.from(accountNames);

  // Initialize the selected Classifications for each 'For Review' transaction.
  const initialCategories: Record<string, string> = {};
  const initialTaxCodes: Record<string, string> = {};

  // Iterate over the passed 'For Review' transactions.
  loadedTransactions.forEach((transaction) => {
    // Assert the formatted 'For Review' transaction type and extract its Classifications.
    const classifiedTransaction =
      transaction[0] as ClassifiedForReviewTransaction;
    const classifications: {
      categories: ClassifiedElement[] | null;
      taxCodes: ClassifiedElement[] | null;
    } = {
      categories: classifiedTransaction.categories,
      taxCodes: classifiedTransaction.taxCodes,
    };

    // Check if each of the Classifications are present.
    // If they are, set the inital Classification of that type to the value in the first index.
    if (classifications.categories) {
      initialCategories[classifiedTransaction.transaction_Id] =
        classifications.categories[0].name;
    }
    if (classifications.taxCodes) {
      initialTaxCodes[classifiedTransaction.transaction_Id] =
        classifications.taxCodes[0].name;
    }
  });

  // Return the Classification selections as well as the list of Account names.
  return {
    categoryRecord: initialCategories,
    taxCodeRecord: initialTaxCodes,
    accountsList: foundAccounts,
  };
}
