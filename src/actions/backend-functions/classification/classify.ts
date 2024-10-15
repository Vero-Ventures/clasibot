'use server';
import Fuse from 'fuse.js';
import {
  batchQueryCategoriesLLM,
  batchQueryTaxCodesLLM,
} from '@/actions/backend-functions/llm-prediction/llm';
import { getAccounts } from '@/actions/quickbooks/get-accounts';
import { checkSubscriptionByCompany } from '@/actions/stripe';
import { getTaxCodes, getTaxCodesByLocation } from '@/actions/quickbooks/taxes';
import {
  addTransactions,
  getTopCategoriesForTransaction,
} from '@/actions/db-transactions';
import type { FuseResult } from 'fuse.js';
import type { Session } from 'next-auth/core/types';
import type { Account } from '@/types/Account';
import type {
  Classification,
  ClassifiedElement,
  ClassifiedResult,
} from '@/types/Classification';
import type { CompanyInfo } from '@/types/CompanyInfo';
import type { FormattedForReviewTransaction } from '@/types/ForReviewTransaction';
import type { TaxCode } from '@/types/TaxCode';
import type { Transaction } from '@/types/Transaction';

// Takes a list of categorized transactions and a list of uncategorized transactions.
export async function classifyTransactions(
  categorizedTransactions: Transaction[],
  uncategorizedTransactions: FormattedForReviewTransaction[],
  realmId: string,
  companyInfo: CompanyInfo,
  session: Session
): Promise<
  | Record<
      string,
      {
        category: ClassifiedElement[] | null;
        taxCode: ClassifiedElement[] | null;
      }
    >
  | { error: string }
> {
  // Call the add transactions action with the categorized transactions.
  addTransactions(categorizedTransactions);

  // Check the subscription status.
  const subscriptionStatus = await checkSubscriptionByCompany(realmId);
  if ('error' in subscriptionStatus) {
    return { error: 'Error getting subscription status' };
  }
  if (!subscriptionStatus.valid) {
    return { error: 'No active subscription' };
  }

  try {
    // Get valid categories from QuickBooks using helper method (categories present in the companies account).
    // Use the backend session that was created and passed to the function to get the companies accounts.
    const validDBCategories: Classification[] = await fetchValidCategories(
      true,
      session
    );
    const validLLMCategories: Classification[] = await fetchValidCategories(
      false,
      session
    );

    // Get valid categories from QuickBooks using helper method.
    const [classifyTaxCodes, validTaxCodes] = await fetchValidTaxCodes(
      companyInfo,
      session
    );

    // Create dictionaries that ties strings (transaction Id's) to a list of categories and a list of tax codes.
    const categoryResults: Record<string, ClassifiedElement[]> = {};
    const taxCodeResults: Record<string, ClassifiedElement[]> = {};

    // Create an array for transactions with no category matches and a list for transactions with no tax code matches.
    const noCategoryMatches: FormattedForReviewTransaction[] = [];
    const noTaxCodeMatches: FormattedForReviewTransaction[] = [];

    // Preform the first two levels of category  with Fuse and the database.
    await classifyCategoriesWithFuse(
      uncategorizedTransactions,
      categorizedTransactions,
      validDBCategories,
      categoryResults,
      noCategoryMatches
    );

    // Check if tax code classification is valid and perform it if it is.
    if (classifyTaxCodes) {
      await classifyTaxCodesWithFuse(
        uncategorizedTransactions,
        categorizedTransactions,
        validTaxCodes,
        taxCodeResults,
        noTaxCodeMatches
      );
    }

    // If there are transactions present in the noMatches array for either type, send them to the LLM API.
    // This categorizes transactions that failed the first two categorization methods.
    if (noCategoryMatches.length > 0) {
      await classifyCategoriesWithLLM(
        noCategoryMatches,
        validLLMCategories,
        categoryResults,
        companyInfo
      );
    }

    // If there were no tax code matches and tax code classification is valid, send them to the LLM API.
    if (noTaxCodeMatches.length > 0 && classifyTaxCodes) {
      await classifyTaxCodesWithLLM(
        noTaxCodeMatches,
        categoryResults,
        validTaxCodes,
        taxCodeResults,
        companyInfo
      );
    }

    // Create an object to track the results in relation to the transaction ID.
    // Nullable values allow for failed predictions or skipped tax code predictions on non-CA accounts.
    const combinedResults: Record<
      string,
      {
        category: ClassifiedElement[] | null;
        taxCode: ClassifiedElement[] | null;
      }
    > = {};

    for (const transaction of uncategorizedTransactions) {
      // Define an object to store results for the transaction and initally set both values to null.
      const newResults: {
        category: ClassifiedElement[] | null;
        taxCode: ClassifiedElement[] | null;
      } = {
        category: null,
        taxCode: null,
      };
      // Check for results in the category and tax code results and record them if present.
      if (categoryResults[transaction.transaction_ID]) {
        newResults.category = categoryResults[transaction.transaction_ID];
      }
      if (taxCodeResults[transaction.transaction_ID]) {
        newResults.taxCode = taxCodeResults[transaction.transaction_ID];
      }
      combinedResults[transaction.transaction_ID] = newResults;
    }

    // Return the results array.
    return combinedResults;
  } catch (error) {
    // Log any errors to the console, then return an error message.
    console.error('Error classifying transactions:', error);
    return { error: 'Error getting categorized transactions:' };
  }
}

// Helper method to fetch valid categories from QuickBooks that returns a promised array of Categories.
async function fetchValidCategories(
  filterToBase: boolean,
  session: Session
): Promise<Classification[]> {
  // Define a list of valid categories using the get_accounts QuickBooks action.
  const validCategoriesResult = JSON.parse(
    await getAccounts('Expense', session)
  );

  if (validCategoriesResult[0].result === 'Error') {
    // Log an error for failure catching.
    console.error(
      validCategoriesResult[0].message +
        ', Detail: ' +
        validCategoriesResult[0].detail
    );
    // If the fetch resulted in an error, return an empty array of classifications.
    return [];
  }

  // Return the valid categories as an array of category objects.
  // Removes the first value that indicates success or returns error codes.
  if (filterToBase) {
    // Filtering to the base category is needed to match with the database values.
    // User info is not stored for saftey so the database uses only the base category value.
    return validCategoriesResult
      .slice(1)
      .map((category: Account): Classification => {
        return {
          type: 'classification',
          id: category.id,
          name: category.account_sub_type,
        };
      });
  } else {
    // LLM data is not saved so it can use the full category name.
    return validCategoriesResult
      .slice(1)
      .map((category: Account): Classification => {
        return { type: 'classification', id: category.id, name: category.name };
      });
  }
}

// Helper method to fetch tax codes from QuickBooks to filter the tax codes present in the classified transaction to valid tax codes.
async function fetchValidTaxCodes(
  companyInfo: CompanyInfo,
  session: Session
): Promise<[boolean, Classification[]]> {
  // Define variable to determine if tax code classification is done on the transactions.
  let classifyTaxCode = false;
  // Define an array to store info on tax codes that can be used in classification.
  const taxCodes: Classification[] = [];

  // Check if tax code classification is possible by locational check on company info.
  if (companyInfo.location.Country === 'CA' && companyInfo.location.Location) {
    // Set tax codes to be found, then find the users tax codes and get the list of valid tax codes.
    classifyTaxCode = true;
    const userTaxCodes = JSON.parse(await getTaxCodes(session));
    const validTaxCodes = await getTaxCodesByLocation(
      companyInfo.location.Location
    );

    // Define the array of tax codes seperate from the query response value and define its type.
    const userTaxCodeArray = userTaxCodes.QueryResponse.slice(1) as TaxCode[];

    // Check that there are values for valid tax code names and the query response from the user tax codes was a success.
    if (
      validTaxCodes.length !== 0 &&
      userTaxCodes.QueryResponse[0].result != 'Success'
    ) {
      // Iterate through user tax codes to record valid tax code info.
      for (const taxCode of userTaxCodeArray) {
        if (validTaxCodes.includes(taxCode.Name)) {
          // If the tax code name is one of the valid tax codes, push it to the array of tax codes.
          taxCodes.push({
            type: 'tax code',
            name: taxCode.Name,
            id: taxCode.Id,
          });
        }
      }
    }
  }
  return [classifyTaxCode, taxCodes];
}

// Helper method to classify transactions using the fuzzy or exact match by Fuse.
// Takes a list of uncategorized transactions, categorized transactions, valid categories, results records, and no matches array.
async function classifyCategoriesWithFuse(
  uncategorizedTransactions: FormattedForReviewTransaction[],
  categorizedTransactions: Transaction[],
  validCategories: Classification[],
  results: Record<string, ClassifiedElement[]>,
  noMatches: FormattedForReviewTransaction[]
): Promise<void> {
  // Use a helper method to create a new Fuse instance with the categorized transactions.
  const fuse = createFuseInstance(categorizedTransactions);

  for (const uncategorizedTransaction of uncategorizedTransactions) {
    try {
      // Search for the uncategorized transaction's name in the list of cataloged transactions.
      const matches = fuse.search(uncategorizedTransaction.name);

      // Create a set of possible categories from the matches found.
      const possibleCategoriesSet = new Set(
        matches.map((match) => match.item.category)
      );

      // Filter the list of possible categories to an array against the list of valid categories.
      const possibleCategories = Array.from(possibleCategoriesSet).filter(
        (category) =>
          validCategories.some((validCat) => validCat.name === category)
      );

      // Create a list to track the possible categories.
      const possibleValidCategories: ClassifiedElement[] = [];

      // Iterate though the valid categoires to find the ones in the filtered set of matches.
      // Use the found valid categories to create the needed classified element objects and store them in an array.
      for (const category of validCategories) {
        if (possibleCategories.includes(category.name)) {
          // Add the matching category to the results array and record it was classified by matching.
          const newCategory = {
            type: 'category',
            id: category.id,
            name: category.name,
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
          uncategorizedTransaction.name,
          validCategories
        );

        // If no possible categories are found in the database, add the transaction to the noMatches array.
        if (topCategories.length === 0) {
          noMatches.push(uncategorizedTransaction);
        } else {
          // Add the transaction and possible categories to the results, and record it was classified by database.
          results[uncategorizedTransaction.transaction_ID] = topCategories.map(
            (category) => ({
              ...category,
              type: 'category',
              classifiedBy: 'Database',
            })
          );
        }
      } else {
        // If matches were found, order them by closest average amount.
        const classificationsMapArray = orderClassificationsByAmount(
          possibleValidCategories,
          matches,
          uncategorizedTransaction,
          'category'
        );

        // Create array for ordered predicted classifications and extract just the classification values.
        const orderedClassifications = [];
        for (let index = 0; index < classificationsMapArray.length; index++) {
          // Get the category name for that index and look for the matching classification object.
          const categoryName = classificationsMapArray[index].element;
          const matchingCategory = possibleValidCategories.find(
            (category) => category.name === categoryName
          );
          // If a matching classification was found, push it into the ordered array of classifications.
          if (matchingCategory) {
            orderedClassifications.push(matchingCategory);
          }
        }

        // Add the ordered list of classified categories with lower index meaning a better matche.
        results[uncategorizedTransaction.transaction_ID] =
          orderedClassifications;
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

// Helper method to classify tax codes using the fuzzy or exact match by Fuse.
// Takes a list of uncategorized transactions, categorized transactions, valid tax codes, results records, and a no matches array.
async function classifyTaxCodesWithFuse(
  uncategorizedTransactions: FormattedForReviewTransaction[],
  categorizedTransactions: Transaction[],
  validTaxCodes: Classification[],
  results: Record<string, ClassifiedElement[] | null>,
  noMatches: FormattedForReviewTransaction[]
): Promise<void> {
  // Use a helper method to create a new Fuse instance with the categorized transactions.
  const fuse = createFuseInstance(categorizedTransactions);

  for (const uncategorizedTransaction of uncategorizedTransactions) {
    try {
      // Search for the uncategorized transaction's name in the list of cataloged transactions.
      const matches = fuse.search(uncategorizedTransaction.name);

      // Create a set of valid categories from the matches found.
      const validTaxCodesSet = new Set<string>();

      // Create a list to track the possible categories.
      const validMatchedtaxCodes: ClassifiedElement[] = [];

      // Iterate through the matches to add the tax codes to the valid matched tax codes.
      for (const match of matches) {
        const taxCodeName = match.item.taxCodeName;
        // Check if the set of tax codes already contains that tax code.
        if (!validTaxCodesSet.has(taxCodeName)) {
          // Check if the tax code is in the list of valid tax codes.
          for (const taxCode of validTaxCodes) {
            if (taxCode.name === taxCodeName) {
              // Create a classified element for the tax code and push it to the valid matched tax code array.
              validMatchedtaxCodes.push({
                //type: Either 'category' or 'tax code'
                type: 'tax code',
                id: taxCode.id,
                name: match.item.taxCodeName,
                classifiedBy: 'Matching',
              });
              // Add the name to indicate not to add the tax code again.
              validTaxCodesSet.add(taxCodeName);
            }
          }
        }
      }

      if (validMatchedtaxCodes.length === 0) {
        // If no valid tax codes are found, search for possible tax codes in the database.
        const topTaxCodes = await getTopCategoriesForTransaction(
          uncategorizedTransaction.name,
          validTaxCodes
        );

        // If no possible categories are found in the database, add the transaction to the noMatches array.
        if (topTaxCodes.length === 0) {
          noMatches.push(uncategorizedTransaction);
        } else {
          // Add the transaction and possible tax codes to the results, and record it was classified by database.
          results[uncategorizedTransaction.transaction_ID] = topTaxCodes.map(
            (taxCode) => ({
              ...taxCode,
              type: 'category',
              classifiedBy: 'Database',
            })
          );
        }
      } else {
        // If matches were found, order them by closest average amount.
        const classificationsMapArray = orderClassificationsByAmount(
          validMatchedtaxCodes,
          matches,
          uncategorizedTransaction,
          'tax code'
        );

        // Create array for ordered predicted tax codes and extract just the tax code values.
        const orderedClassifications = [];
        for (let index = 0; index < classificationsMapArray.length; index++) {
          // Get the category name for that index and look for the matching classification object.
          const categoryName = classificationsMapArray[index].element;
          const matchingCategory = validMatchedtaxCodes.find(
            (category) => category.name === categoryName
          );
          // If a matching classification was found, push it into the ordered array of classifications.
          if (matchingCategory) {
            orderedClassifications.push(matchingCategory);
          }
        }

        // Add the ordered list of classified tax codes.
        // A lower index indicates  a better match so default display (index 0) is the best match.
        results[uncategorizedTransaction.transaction_ID] =
          orderedClassifications;
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

// Averages total for matching transactions by their classifications.
// Returns an array of categories and their difference ordered by closest value to real transaction amount.
function orderClassificationsByAmount(
  possibleValidElements: ClassifiedElement[],
  matches: FuseResult<Transaction>[],
  formattedTransaction: FormattedForReviewTransaction,
  type: string
): { element: string; difference: number }[] {
  // If there were matches with valid categories, find the average amount of each element.
  // Assosiate a element name to a count of occurences and a total.
  const categoryAverages: Record<string, [number, number]> = {};

  // Initalize each category as [0, 0].
  for (const category of possibleValidElements) {
    categoryAverages[category.name] = [0, 0];
  }

  // Run proccess if called by category classification.
  if (type === 'category') {
    // Iterate through the matches and check if they have a valid category.
    matches.map((match) => {
      const matchCategory = match.item.category;
      // Check if the match category matches at least one name in the list of possible valid categories.
      if (
        possibleValidElements.some(
          (category) => category.name === matchCategory
        )
      ) {
        // Increment the number of matches for the category and add the amount to the total.
        categoryAverages[matchCategory][0] += 1;
        // Use abs to account for possibility of expenses being recorded as positive or negitive.
        categoryAverages[matchCategory][1] += Math.abs(match.item.amount);
      }
    });
  } else {
    // Iterate through the matches and check if they have a valid category.
    matches.map((match) => {
      const matchTaxCode = match.item.taxCodeName;
      // Check if the match category matches at least one name in the list of possible valid categories.
      if (
        possibleValidElements.some((category) => category.name === matchTaxCode)
      ) {
        // Increment the number of matches for the category and add the amount to the total.
        categoryAverages[matchTaxCode][0] += 1;
        // Use abs to account for possibility of expenses being recorded as positive or negitive.
        categoryAverages[matchTaxCode][1] += Math.abs(match.item.amount);
      }
    });
  }

  // Make a map of the categories with the count of their occurences and their total.
  const sortedCategoryAverages = Object.entries(categoryAverages)
    .map(([element, [count, total]]) => {
      // Define an average based on count and total, accounting for a potential count of 0.
      const average = count > 0 ? total / count : 0;
      // Define the difference from the transaction being predicted using absolute value.
      const difference = Math.abs(formattedTransaction.amount - average);
      // Return the differences to be sorted into an array of dictionaries containing the element and the difference.
      return { element, difference };
    })
    // Sort will put A before B if (A - B) is negitive, keep order if the same, and put B before A if positive.
    .sort((a, b) => a.difference - b.difference);

  return sortedCategoryAverages;
}

// Helper method to classify transactions using the LLM API.
async function classifyCategoriesWithLLM(
  noMatches: FormattedForReviewTransaction[],
  validCategories: Classification[],
  results: Record<string, ClassifiedElement[]>,
  companyInfo: CompanyInfo
): Promise<void> {
  let llmApiResponse: ClassifiedResult[];
  try {
    // Call the LLM API with the array of matchless transactions, the list of valid categories, and the company info.
    llmApiResponse = await batchQueryCategoriesLLM(
      noMatches,
      validCategories,
      companyInfo
    );
    // If a response is received, iterate over the response.
    if (llmApiResponse) {
      for (const llmResult of llmApiResponse) {
        // Record the current LLM result to the results and note it was classified by LLM API .
        results[llmResult.transaction_ID] =
          llmResult.possibleClassifications.map((category) => ({
            ...category,
            classifiedBy: 'LLM API',
          }));
      }
    }
  } catch (error) {
    // Catch any errors and log them to the console.
    console.error('Error from LLM API usage: ', error);
  }
}

// Helper method to classify transactions using the LLM API.
async function classifyTaxCodesWithLLM(
  noMatches: FormattedForReviewTransaction[],
  categoryResults: Record<string, ClassifiedElement[]>,
  validTaxCodes: Classification[],
  results: Record<string, ClassifiedElement[]>,
  companyInfo: CompanyInfo
): Promise<void> {
  let llmApiResponse: ClassifiedResult[];
  try {
    // Call the LLM API with the array of matchless transactions and the list of valid categories.
    // Also passes the found categories and company info to potenitally use as context.
    llmApiResponse = await batchQueryTaxCodesLLM(
      noMatches,
      categoryResults,
      validTaxCodes,
      companyInfo
    );
    // If a response is received, iterate over the response.
    if (llmApiResponse) {
      for (const llmResult of llmApiResponse) {
        // Record the current LLM result to the results and note it was classified by LLM API .
        results[llmResult.transaction_ID] =
          llmResult.possibleClassifications.map((category) => ({
            ...category,
            classifiedBy: 'LLM API',
          }));
      }
    }
  } catch (error) {
    // Catch any errors and log them to the console.
    console.error('Error from LLM API usage: ', error);
  }
}
