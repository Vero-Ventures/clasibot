/**
 * Defines a classify transaction function that takes a list of categorized transactions and a list of uncategorized transactions.
 * Uses the categorized transactions to classify the uncategorized transactions. Uses database to save the results.
 * Returns an error if the subscription is invalid or if an error occurs during the classification process.
 *
 * Uses helper methods to classify transactions using the fuzzy or exact match by Fuse and the LLM API.
 * Also uses helper methods to fetch valid categories from QuickBooks, create a new Fuse instance with the categorized transactions, and call the LLM API.
 */
'use server';
import Fuse from 'fuse.js';
import { batchQueryLLM } from '@/actions/llm';
import { getAccounts } from '@/actions/quickbooks';
import { checkSubscription } from '@/actions/stripe';
import {
  addTransactions,
  getTopCategoriesForTransaction,
} from '@/actions/transactionDatabase';
import type { Account } from '@/types/Account';
import type { Category, ClassifiedCategory } from '@/types/Category';
import type { CategorizedResult } from '@/types/CategorizedResult';
import type { Transaction } from '@/types/Transaction';

// Takes a list of categorized transactions and a list of uncategorized transactions.
export async function classifyTransactions(
  categorizedTransactions: Transaction[],
  uncategorizedTransactions: Transaction[]
): Promise<Record<string, ClassifiedCategory[]> | { error: string }> {
  // Call the add transactions action with the categorized transactions.
  addTransactions(categorizedTransactions);

  // Check the subscription status.
  const subscriptionStatus = await checkSubscription();

  // If an error occurs during the subscription status check, return an error.
  if ('error' in subscriptionStatus) {
    return { error: 'Error getting subscription status' };
  }

  // If the subscription is invalid, return an error.
  if (!subscriptionStatus.valid) {
    return { error: 'No active subscription' };
  }

  try {
    // Get valid categories from QuickBooks using helper method (categories present in the users account).
    const validCategories: Category[] = await fetchValidCategories();

    // Create an dictionary that ties strings to a list of categories.
    const results: Record<string, ClassifiedCategory[]> = {};

    // Create an array for transactions with no matches.
    const noMatches: Transaction[] = [];

    // Call the classifyWithFuse function with the fuse object, uncategorized transactions, valid categories, results, and noMatches.
    // Handles the classification of transactions using the fuzzy or exact match by Fuse.
    await classifyWithFuse(
      uncategorizedTransactions,
      categorizedTransactions,
      validCategories,
      results,
      noMatches
    );

    // If there are transactions present in the noMatches array, send them to the LLM API.
    // This categorizes transactions that failed the first two categorization methods.
    if (noMatches.length > 0) {
      // Call the classifyWithLLM function with the uncategorized transactions, noMatches, valid categories, and results.
      // Handles the classification of transactions using the LLM API.
      await classifyWithLLM(
        uncategorizedTransactions,
        noMatches,
        validCategories,
        results
      );
    }

    // Return the results array.
    return results;
  } catch (error) {
    // Log any errors to the console.
    console.error('Error classifying transactions:', error);
    // Catch any errors and return them.
    return { error: 'Error getting categorized transactions:' };
  }
}

// Helper method to classify transactions using the fuzzy or exact match by Fuse.
async function classifyWithFuse(
  uncategorizedTransactions: Transaction[],
  categorizedTransactions: Transaction[],
  validCategories: Category[],
  results: Record<string, ClassifiedCategory[]>,
  noMatches: Transaction[]
): Promise<void> {
  // Use another helper method to create a new Fuse instance with the categorized transactions.
  const fuse = createFuseInstance(categorizedTransactions);

  // Iterate over the uncategorized transactions.
  for (const uncategorized of uncategorizedTransactions) {
    try {
      // Search for the uncategorized transaction's name in the list of cataloged transactions.
      const matches = fuse.search(uncategorized.name);

      // Create a set of possible categories from the matches found.
      const possibleCategoriesSet = new Set(
        // Filter the name to just the last value after splitting by ':'.
        matches.map((match) => match.item.category.split(':').pop())
      );

      // Create an array of possible categories from the set.
      const possibleCategories = Array.from(possibleCategoriesSet);

      // Get the list of possible categories from the users account.
      const accounts = JSON.parse(await getAccounts());

      // Define a variable to hold the possible valid categories.
      const possibleValidCategories: ClassifiedCategory[] = [];

      // Iterate over the accounts to see if its name is present in the list of possible categories.
      for (const account of accounts) {
        if (possibleCategories.includes(account.name)) {
          // If the account name is present in the possible categories, add it to the results array.
          // Also records the category was classified by the fuzzy or exact match by Fuse.
          const newCategory = {
            id: account.id,
            name: account.name,
            classifiedBy: 'Matching',
          };
          // Check if the category is not already in the possible valid categories.
          if (
            !possibleValidCategories.find(
              (category) => category.name === newCategory.name
            )
          ) {
            // If not, add it to the possible valid categories.
            possibleValidCategories.push(newCategory);
          }
        }
      }

      if (possibleValidCategories.length === 0) {
        // If no possible valid categories are found, search for possible categories in the database.
        const topCategories = await getTopCategoriesForTransaction(
          uncategorized.name,
          validCategories
        );

        // If no possible categories are found in the database, add the transaction to the noMatches array.
        if (topCategories.length === 0) {
          noMatches.push(uncategorized);
        } else {
          // Otherwise, add the transaction and its possible categories to the results array.
          results[uncategorized.transaction_ID] = topCategories.map(
            (category) => ({
              ...category,
              classifiedBy: 'Database',
            })
          );
          // Also records the category was classified by the database lookup.
        }
      } else {
        // If valid categories were found in the users account:
        // add the transaction and its possible categories to the results array.
        results[uncategorized.transaction_ID] = possibleValidCategories;
      }
    } catch (error) {
      // Catch any errors and log them to the console.
      console.error(
        'Error mapping uncategorized transaction:',
        uncategorized,
        error,
        'moving on...'
      );
    }
  }
}

// Helper method to classify transactions using the LLM API.
async function classifyWithLLM(
  uncategorizedTransactions: Transaction[],
  noMatches: Transaction[],
  validCategories: Category[],
  results: Record<string, ClassifiedCategory[]>
): Promise<void> {
  // Define a variable to store the LLM API response.
  let llmApiResponse;
  try {
    // Call the LLM API with the array of matchless transactions and the list of valid categories.
    llmApiResponse = await sendToLLMApi(noMatches, validCategories);
    // If a response is received, iterate over the response.
    if (llmApiResponse) {
      for (const llmResult of llmApiResponse) {
        // Record the current LLM result to the results array by the transaction ID.
        results[llmResult.transaction_ID] = llmResult.possibleCategories.map(
          (category) => ({
            ...category,
            classifiedBy: 'LLM API',
          })
        );
        // Also records the category was classified by the LLM API.

        // Find the transaction to add by the transaction ID.
        const transactionToAdd = uncategorizedTransactions.find(
          (transaction) =>
            transaction.transaction_ID === llmResult.transaction_ID
        );

        if (transactionToAdd) {
          // If a transaction is found, record its associated categories.
          const categorizedTransactionsToAdd = llmResult.possibleCategories.map(
            (category) => ({
              ...transactionToAdd,
              category: category.name,
            })
          );

          // Add the categorized transactions to the database.
          await addTransactions(categorizedTransactionsToAdd);
        }
      }
    }
  } catch (error) {
    // Catch any errors and log them to the console.
    console.error('Error from LLM API usage: ', error);
  }
}

// Helper method to fetch valid categories from QuickBooks that returns a promised array of Categories.
async function fetchValidCategories(): Promise<Category[]> {
  // Define a list of valid categories using the get_accounts QuickBooks action.
  // Accounts are the QuickBooks name for both bank accounts and transaction categories.
  const validCategoriesResponse = JSON.parse(await getAccounts());
  // Return the valid categories as an array of category objects.
  // Removes the first value that indicates success or returns error codes
  return validCategoriesResponse.slice(1).map((category: Account): Category => {
    return { id: category.id, name: category.name };
  });
}

// Takes a list of categorized transactions.
function createFuseInstance(
  categorizedTransactions: Transaction[]
): Fuse<Transaction> {
  // Create and return a fuse object with a set of defined parameters.
  return new Fuse(categorizedTransactions, {
    includeScore: true,
    threshold: 0.3,
    keys: ['name'],
  });
}

// Takes a list of uncategorized transactions and a list of valid categories.
// Calls the batchQueryLLM action then returns a promised array of categorized results.
const sendToLLMApi = async (
  uncategorizedTransactions: Transaction[],
  validCategories: Category[]
): Promise<CategorizedResult[]> =>
  batchQueryLLM(uncategorizedTransactions, validCategories);