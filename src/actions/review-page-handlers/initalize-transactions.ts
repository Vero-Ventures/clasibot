'use server';

import type {
  ClassifiedElement,
  ForReviewTransaction,
  ClassifiedForReviewTransaction,
} from '@/types/index';

// Takes a set of loaded 'For Review' transactions either from inital page load or finishing manual Classification.
// Initalizes the inital selected Category and Tax Code for each 'For Review' transaction.
// Also creates a set of Account names from within the passed 'For Review' transactions.
// Takes: The loaded 'For Review' transactions.
// Returns: The record of selected Classifications as well as the list of unique Account names.
export async function initalizeLoadedTransactions(
  loadedTransactions: (
    | ForReviewTransaction
    | ClassifiedForReviewTransaction
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
    accountNames.add(formattedTransaction.account);
  }

  // Define the list of Accounts state with a list of unique Account names from the set.
  const foundAccounts = Array.from(accountNames);

  // Initialize the selected Classifications for each 'For Review' transaction.
  const initialCategories: Record<string, string> = {};
  const initialTaxCodes: Record<string, string> = {};
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
    // If they are, set the inital Classification of that type for the 'For Review' transaction to the value in the first index.
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
