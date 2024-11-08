'use server';
import type { ClassifiedElement } from '@/types/Classification';
import type {
  ForReviewTransaction,
  ClassifiedForReviewTransaction,
} from '@/types/ForReviewTransaction';

// Takes a set of loaded 'For Review' transactions either from inital page load or finishing manual Classification.
// Initalizes the inital selected Category and Tax Code for each 'For Review' transaction.
// Also creates a set of Account names from within the passed 'For Review' transactions.
// Takes: The loaded 'For Review' transactions, state updaters for the Classification types and for the set of Account names.
// Returns: None, uses state updaters to pass result frontend.
export async function initalizeLoadedTransactions(
  loadedTransactions: (
    | ForReviewTransaction
    | ClassifiedForReviewTransaction
  )[][],
  setSelectedCategories: (newState: Record<string, string>) => void,
  setSelectedTaxCodes: (newState: Record<string, string>) => void,
  setAccounts: (newState: string[]) => void
) {
  // Create a set to track Account names without duplicates, then add all Account names to the set.
  const accountNames = new Set<string>();
  for (const transaction of loadedTransactions) {
    const formattedTransaction =
      transaction[0] as ClassifiedForReviewTransaction;
    accountNames.add(formattedTransaction.account);
  }

  // Update the list of Accounts state with a list of unique Account names from the set.
  setAccounts(Array.from(accountNames));

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
  // Update the selected Categories and Tax Sodes state with the initial Classifications.
  setSelectedCategories(initialCategories);
  setSelectedTaxCodes(initialTaxCodes);
}
