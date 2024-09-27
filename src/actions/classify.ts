'use server';
import Fuse from 'fuse.js';
import { batchQueryLLM } from '@/actions/llm-prediction/llm';
import { getAccounts } from '@/actions/quickbooks/get-accounts';
import { checkSubscription } from '@/actions/stripe';
import {
  addTransactions,
  getTopCategoriesForTransaction,
} from '@/actions/transaction-database';
import type { FuseResult } from 'fuse.js';
import type { Account } from '@/types/Account';
import type {
  Category,
  ClassifiedCategory,
  CategorizedResult,
} from '@/types/Category';
import type {
  ForReviewTransaction,
  FormattedForReviewTransaction,
} from '@/types/ForReviewTransaction';
import type { Transaction } from '@/types/Transaction';

// Takes a list of categorized transactions and a list of uncategorized transactions.
export async function classifyTransactions(
  categorizedTransactions: Transaction[],
  uncategorizedTransactions: (
    | FormattedForReviewTransaction
    | ForReviewTransaction
  )[][]
): Promise<Record<string, ClassifiedCategory[]> | { error: string }> {
  // Call the add transactions action with the categorized transactions.
  addTransactions(categorizedTransactions);

  // Check the subscription status.
  const subscriptionStatus = await checkSubscription();
  if ('error' in subscriptionStatus) {
    return { error: 'Error getting subscription status' };
  }
  if (!subscriptionStatus.valid) {
    return { error: 'No active subscription' };
  }

  try {
    // Get valid categories from QuickBooks using helper method (categories present in the users account).
    const validDBCategories: Category[] = await fetchValidCategories(true);
    const validLLMCategories: Category[] = await fetchValidCategories(false);

    // Create an dictionary that ties strings to a list of categories.
    const results: Record<string, ClassifiedCategory[]> = {};

    // Create an array for transactions with no matches.
    const noMatches: FormattedForReviewTransaction[] = [];

    // Preform the first two levels of classification with Fuse and the database.
    await classifyWithFuse(
      uncategorizedTransactions,
      categorizedTransactions,
      validDBCategories,
      results,
      noMatches
    );

    // If there are transactions present in the noMatches array, send them to the LLM API.
    // This categorizes transactions that failed the first two categorization methods.
    if (noMatches.length > 0) {
      await classifyWithLLM(noMatches, validLLMCategories, results);
    }

    // Return the results array.
    return results;
  } catch (error) {
    // Log any errors to the console, then return an error message.
    console.error('Error classifying transactions:', error);
    return { error: 'Error getting categorized transactions:' };
  }
}

// Helper method to classify transactions using the fuzzy or exact match by Fuse.
// Takes a list of uncategorized transactions, categorized transactions, valid categories, results records, and no matches array.
async function classifyWithFuse(
  uncategorizedTransactions: (
    | FormattedForReviewTransaction
    | ForReviewTransaction
  )[][],
  categorizedTransactions: Transaction[],
  validCategories: Category[],
  results: Record<string, ClassifiedCategory[]>,
  noMatches: FormattedForReviewTransaction[]
): Promise<void> {
  // Use a helper method to create a new Fuse instance with the categorized transactions.
  const fuse = createFuseInstance(categorizedTransactions);

  for (const uncategorizedTransaction of uncategorizedTransactions) {
    try {
      // Define the formatted uncategorized transaction.
      const formattedTransaction =
        uncategorizedTransaction[0] as FormattedForReviewTransaction;
      // Search for the uncategorized transaction's name in the list of cataloged transactions.
      const matches = fuse.search(formattedTransaction.name);

      // Create a set of possible categories from the matches found.
      const possibleCategoriesSet = new Set(
        // Filter the name to just the last value after splitting by ':'.
        // Account names such as Job Expenses:Job Materials:Saplings will return Saplings.
        matches.map((match) => match.item.category.split(':').pop())
      );
      const possibleCategories = Array.from(possibleCategoriesSet);

      // Get the list of possible categories from the users account.
      const accounts = JSON.parse(await getAccounts('Expense'));
      const possibleValidCategories: ClassifiedCategory[] = [];

      // Iterate over the accounts to see if its name is present in the list of possible categories.
      for (const account of accounts) {
        if (possibleCategories.includes(account.name)) {
          // Add the matching category to the results array and record it was classified by matching.
          const newCategory = {
            id: account.id,
            name: account.name,
            classifiedBy: 'Matching',
          };
          // Add the category if it is not already in the possible valid categories.
          if (
            !possibleValidCategories.find(
              (category) => category.name === newCategory.name
            )
          ) {
            possibleValidCategories.push(newCategory);
          }
        }
      }
      if (possibleValidCategories.length === 0) {
        // If no possible valid categories are found, search for possible categories in the database.
        const topCategories = await getTopCategoriesForTransaction(
          formattedTransaction.name,
          validCategories
        );

        // If no possible categories are found in the database, add the transaction to the noMatches array.
        if (topCategories.length === 0) {
          noMatches.push(formattedTransaction);
        } else {
          // Add the transaction and possible categories to the results, and record it was classified by database.
          results[formattedTransaction.transaction_ID] = topCategories.map(
            (category) => ({
              ...category,
              classifiedBy: 'Database',
            })
          );
        }
      } else {
        // Call function to order predictions by amount.
        const classificationsMapArray = orderClassificationsByAmount(
          possibleValidCategories,
          matches,
          formattedTransaction
        );

        // Create array for ordered predicted classifications and extract just the classification values.
        const orderedClassifications = [];
        for (let index = 0; index < classificationsMapArray.length; index++) {
          // Get the category name for that index and look for the matching classification object.
          const categoryName = classificationsMapArray[index].category;
          const matchingCategory = possibleValidCategories.find(
            (category) => category.name === categoryName
          );
          // If a matching classification was found, push it into the ordered array of classifications.
          if (matchingCategory) {
            orderedClassifications.push(matchingCategory);
          }
        }

        // Add the ordered list of classified categories with lower index meaning a better matche.
        results[formattedTransaction.transaction_ID] = orderedClassifications;
      }
    } catch (error) {
      // Catch any errors and log them to the console.
      console.error(
        'Error mapping uncategorized transaction:',
        uncategorizedTransaction,
        error,
        'moving on...'
      );
    }
  }
}

// Averages total for matching transactions by their classifications.
// Returns an array of categories and their difference ordered by closest value to real transaction amount.
function orderClassificationsByAmount(
  possibleValidCategories: ClassifiedCategory[],
  matches: FuseResult<Transaction>[],
  formattedTransaction: FormattedForReviewTransaction
): { category: string; difference: number }[] {
  // If there were matches with valid categories, find the average amount of each category.
  // Assosiate a category name to a count of occurences and a total.
  const categoryAverages: Record<string, [number, number]> = {};

  // Initalize each category as [0, 0].
  for (const category of possibleValidCategories) {
    categoryAverages[category.name] = [0, 0];
  }

  // Iterate through the matches and check if they have a valid category.
  matches.map((match) => {
    const matchCategory = match.item.category.split(':').pop()!;
    // Check if the match category matches at least one name in the list of possible valid categories.
    if (
      possibleValidCategories.some(
        (category) => category.name === matchCategory
      )
    ) {
      // Increment the number of matches for the category and add the amount to the total.
      categoryAverages[matchCategory][0] += 1;
      // Use abs to account for possibility of expenses being recorded as positive or negitive.
      categoryAverages[matchCategory][1] += Math.abs(match.item.amount);
    }
  });

  // Make a map of the categories with the count of their occurences and their total.
  const sortedCategoryAverages = Object.entries(categoryAverages)
    .map(([category, [count, total]]) => {
      // Define an average based on count and total, accounting for a potential count of 0.
      const average = count > 0 ? total / count : 0;
      // Define the difference from the transaction being predicted using absolute value.
      const difference = Math.abs(formattedTransaction.amount - average);
      // Return the differences to be sorted into an array of dictionaries containing the category and the difference.
      return { category, difference };
    })
    // Sort will put A before B if (A - B) is negitive, keep order if the same, and put B before A if positive.
    .sort((a, b) => a.difference - b.difference);
  return sortedCategoryAverages;
}

// Helper method to classify transactions using the LLM API.
async function classifyWithLLM(
  noMatches: Transaction[],
  validCategories: Category[],
  results: Record<string, ClassifiedCategory[]>
): Promise<void> {
  let llmApiResponse;
  try {
    // Call the LLM API with the array of matchless transactions and the list of valid categories.
    llmApiResponse = await sendToLLMApi(noMatches, validCategories);
    // If a response is received, iterate over the response.
    if (llmApiResponse) {
      for (const llmResult of llmApiResponse) {
        // Record the current LLM result to the results and note it was classified by LLM API .
        results[llmResult.transaction_ID] = llmResult.possibleCategories.map(
          (category) => ({
            ...category,
            classifiedBy: 'LLM API',
          })
        );
      }
    }
  } catch (error) {
    // Catch any errors and log them to the console.
    console.error('Error from LLM API usage: ', error);
  }
}

// Helper method to fetch valid categories from QuickBooks that returns a promised array of Categories.
async function fetchValidCategories(
  filterToBase: boolean
): Promise<Category[]> {
  // Define a list of valid categories using the get_accounts QuickBooks action.
  // Accounts are the QuickBooks name for both bank accounts and transaction categories.
  const validCategoriesResponse = JSON.parse(await getAccounts('Expense'));
  // Return the valid categories as an array of category objects.
  // Removes the first value that indicates success or returns error codes.
  if (filterToBase) {
    // Filter to base category is needed to match with the database.
    // User info is not stored so only the base category is stored.
    return validCategoriesResponse
      .slice(1)
      .map((category: Account): Category => {
        return { id: category.id, name: category.account_sub_type };
      });
  } else {
    // LLM data is not saved so it can use the full category name.
    return validCategoriesResponse
      .slice(1)
      .map((category: Account): Category => {
        return { id: category.id, name: category.name };
      });
  }
}

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

// Calls the batchQueryLLM action then returns a promised array of categorized results.
const sendToLLMApi = async (
  uncategorizedTransactions: Transaction[],
  validCategories: Category[]
): Promise<CategorizedResult[]> =>
  batchQueryLLM(uncategorizedTransactions, validCategories);
