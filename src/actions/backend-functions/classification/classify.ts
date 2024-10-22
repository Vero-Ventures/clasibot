'use server';
import Fuse from 'fuse.js';
import type { FuseResult } from 'fuse.js';
import {
  addTransactions,
  getTopCategoriesForTransaction,
} from '@/actions/db-transactions';
import { getAccounts } from '@/actions/quickbooks/get-accounts';
import { getTaxCodes, getTaxCodesByLocation } from '@/actions/quickbooks/taxes';
import { batchQueryLLM } from '@/actions/backend-functions/llm-prediction/llm';
import { checkSubscription } from '@/actions/stripe';
import type { Account } from '@/types/Account';
import type {
  Classification,
  ClassifiedElement,
  ClassifiedResult,
} from '@/types/Classification';
import type { CompanyInfo } from '@/types/CompanyInfo';
import type { FormattedForReviewTransaction } from '@/types/ForReviewTransaction';
import type { LoginTokens } from '@/types/LoginTokens';
import type { TaxCode } from '@/types/TaxCode';
import type { Transaction } from '@/types/Transaction';

// Takes a list of saved transactions and a list of uncategorized 'For Review' transactions.
// Also takes the a synthetic login session and the company info used for tax codes and LLM classification.
// Returns: A record that connects a transaction ID to an array of classified elements for bothe categories and tax codes.
//    On error, instead returns an object with field error that contains a short error message.
export async function classifyTransactions(
  categorizedTransactions: Transaction[],
  uncategorizedTransactions: FormattedForReviewTransaction[],
  companyInfo: CompanyInfo,
  loginTokens: LoginTokens,
  companyId: string
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
  try {
    // Save the users saved (classified) transactions to the database for DB classification.
    const result = await addTransactions(categorizedTransactions);

    // Check the Query Result returned by the add transactions function and return its message and detail it if it is an error.
    if (result.result === 'Error') {
      console.error(
        'Error saving existing classified user transactions:',
        result.message,
        ', Detail: ',
        result.detail
      );
      return { error: 'Error saving existing classified transactions.' };
    }
  } catch (error) {
    // Log any errors to the console, then return an error message.
    if (error instanceof Error) {
      console.error(
        'Error saving existing classified transactions: ' + error.message
      );
    } else {
      console.error(
        'Unexpected Error Saving Existing Classified Transactions.'
      );
    }
    return { error: 'Error saving existing classified transactions.' };
  }

  // Check the users subscription status using the realmId fromn the passed synthetic session.
  // If there is an error or the subscription status is invalud, return an error object.
  const subscriptionStatus = await checkSubscription(companyId);
  if ('error' in subscriptionStatus) {
    return { error: 'Error getting user subscription status.' };
  }
  if (!subscriptionStatus.valid) {
    return { error: 'No active user subscription.' };
  }

  try {
    // Get valid categories from QuickBooks (categories present in the companies account) using synthetic session.
    // Fetch parsed names for DB useage. (DB saves transactions with base names to avoid identifing user information).
    const validDBCategories: Classification[] = await fetchValidCategories(
      true,
      loginTokens,
      companyId
    );
    const validLLMCategories: Classification[] = await fetchValidCategories(
      false,
      loginTokens,
      companyId
    );

    // Get use the location from the company info to get the valid tax codes.
    const [classifyTaxCodes, validTaxCodes] = await fetchValidTaxCodes(
      companyInfo,
      loginTokens,
      companyId
    );

    // Create dictionaries that ties strings (transaction Id's) to a list of categories and a list of tax codes.
    const categoryResults: Record<string, ClassifiedElement[]> = {};
    const taxCodeResults: Record<string, ClassifiedElement[]> = {};

    // Create an array for 'For Review' transactions with no category matches and a list for 'For Review' transactions with no tax code matches.
    const noCategoryMatches: FormattedForReviewTransaction[] = [];
    const noTaxCodeMatches: FormattedForReviewTransaction[] = [];

    // Use a helper method to create a new Fuse instance with the categorized transactions.
    const fuse = createFuseInstance(categorizedTransactions);

    // Preform the first two levels of category classification with Fuse and database matching.
    await classifyWithFuse(
      uncategorizedTransactions,
      fuse,
      validDBCategories,
      categoryResults,
      noCategoryMatches,
      'category'
    );

    // Check if tax code classification is possible.
    if (classifyTaxCodes) {
      // Preform the first two levels of tax code classification with Fuse and database matching.
      await classifyWithFuse(
        uncategorizedTransactions,
        fuse,
        validTaxCodes,
        taxCodeResults,
        noTaxCodeMatches,
        'tax code'
      );
    }

    // If there are 'For Review' transactions present in the noMatches array for categories, send them to the LLM API.
    // This categorizes 'For Review' transactions that failed the first two categorization methods.
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

    // Create an object to track the results in relation to the 'For Review' transaction ID.
    // Nullable values allow for failed predictions or for the skipped tax code predictions on non-CA accounts.
    const combinedResults: Record<
      string,
      {
        category: ClassifiedElement[] | null;
        taxCode: ClassifiedElement[] | null;
      }
    > = {};

    // Iterate through the initally passed, uncategorized 'For Review' transactions.
    for (const transaction of uncategorizedTransactions) {
      // Define object to store results for the current 'For Review' transaction and initally set both values to null.
      const newResults: {
        category: ClassifiedElement[] | null;
        taxCode: ClassifiedElement[] | null;
      } = {
        category: null,
        taxCode: null,
      };

      // Check for results in the category and tax code results. Record the value to the related field in the results if present.
      if (categoryResults[transaction.transaction_ID]) {
        newResults.category = categoryResults[transaction.transaction_ID];
      }
      if (taxCodeResults[transaction.transaction_ID]) {
        newResults.taxCode = taxCodeResults[transaction.transaction_ID];
      }

      // Update the record of results with the 'For Review' transactions classification results connected to its ID.
      combinedResults[transaction.transaction_ID] = newResults;
    }

    // Return the results record connecting 'For Review' transaction ID's to their results objects.
    return combinedResults;

    // Catch any errors and check for an error message.
  } catch (error) {
    // Log any errors to the console, then return an error message.
    if (error instanceof Error) {
      console.error('Error Classifying New Transactions: ' + error.message);
    } else {
      console.error('Unexpected Classifying New Transactions.');
    }
    return { error: 'Uncexpected error classifying transaction.' };
  }
}

// Helper method to fetch users categories from QuickBooks and filters to base category if needed.
// Takes a boolean to indicate filtering and a synthetic session.
// Returns: An array of classification objects for the catagories in the users expense accounts.
async function fetchValidCategories(
  filterToBase: boolean,
  loginTokens: LoginTokens,
  companyId: string
): Promise<Classification[]> {
  try {
    // Gets a list of valid categories by getting the users 'Expense' type accounts.
    const validCategoriesResult = JSON.parse(
      await getAccounts('Expense', loginTokens, companyId)
    );

    // Check if the account fetch query result was an error.
    if (validCategoriesResult[0].result === 'Error') {
      // Log an error for failure catching using the Query Result.
      console.error(
        validCategoriesResult[0].message +
          ', Detail: ' +
          validCategoriesResult[0].detail
      );
      // On fetch error, return an empty array of classifications.
      return [];
    }

    // Check if the categories need to be filtered prior to being returned.
    if (filterToBase) {
      // User info is not stored for security so the database uses only the base category value.
      // Therefore, filtering to the base category is needed in database matching steps.
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
          return {
            type: 'classification',
            id: category.id,
            name: category.name,
          };
        });
    }
    // Catch any errors and check for an error message.
  } catch (error) {
    // Return an appropriate message indicating an unexpected error.
    if (error instanceof Error) {
      console.error('Error Getting Category Classifications: ' + error.message);
    } else {
      console.error('Unexpected Error Getting Category Classifications.');
    }
    // On error, return an empty classification array.
    return [];
  }
}

// Helper method to fetch users tax codes from QuickBooks and filter to the ones applicable for the companies location.
// Takes the company info for the location and a synthetic session.
// Returns: An array of classification objects for the tax codes in the companies location.
async function fetchValidTaxCodes(
  companyInfo: CompanyInfo,
  loginTokens: LoginTokens,
  companyId: string
): Promise<[boolean, Classification[]]> {
  try {
    // Define variable to inform caller if tax code classification is doable for the user.
    let classifyTaxCode = false;
    // Define an array to store tax codes to be used in classification.
    const taxCodes: Classification[] = [];

    // Check if tax code classification is possible by locational check on company info.
    // Presently only allow Canadian companies with a valid sub-location.
    if (
      companyInfo.location.Country === 'CA' &&
      companyInfo.location.SubLocation
    ) {
      // Set tax codes classification to be valid, then use the passed synthetic session to get the users tax codes.
      classifyTaxCode = true;
      const userTaxCodes = JSON.parse(
        await getTaxCodes(loginTokens, companyId)
      );

      // Also fetch the valid tax codes for a user by their sub-location.
      const validLocationalTaxCodes = await getTaxCodesByLocation(
        companyInfo.location.SubLocation
      );

      // Check there are valid tax codes (error check) and the query response from getting user tax codes was a success.
      if (
        validLocationalTaxCodes.length !== 0 &&
        userTaxCodes[0].result != 'Success'
      ) {
        // Extract the user tax codes from the result by removing the query result
        const userTaxCodeArray = userTaxCodes[0].slice(1) as TaxCode[];

        // Iterate through user tax codes to record valid tax code info.
        for (const taxCode of userTaxCodeArray) {
          // If the current tax code name is one of the valid locational tax codes, push it to the array of tax codes.
          if (validLocationalTaxCodes.includes(taxCode.Name)) {
            taxCodes.push({
              type: 'tax code',
              name: taxCode.Name,
              id: taxCode.Id,
            });
          }
        }
      } else {
        // When an error occurs, log an error before containing.
        console.log(
          'Error getting tax codes, Message: ' +
            userTaxCodes[0].message +
            ', Detail: ' +
            userTaxCodes[0].detail
        );
      }
    }
    // Return an array indicating if tax classification is possible and a (possibly empty) array of tax code classifications.
    return [classifyTaxCode, taxCodes];
    // Catch any errors and check for an error message.
  } catch (error) {
    // Return an appropriate message indicating an unexpected error.
    if (error instanceof Error) {
      console.error('Error Getting Tax Code Classifications: ' + error.message);
    } else {
      console.error('Unexpected Error Getting Tax Code Classifications.');
    }
    // On error, indicate classification is not possible and return an empty array.
    return [false, []];
  }
}

// Helper method to classify 'For Review' transactions using fuse and database matching.
// Takes uncategorized 'For Review' transactions, fuse object for matching 'For Review' transactions, valid classifications, -
// a results records, array of 'For Review' transactions with no matches, and classification type.
// Returns: Does not return, instead modifing the passed arrays.
async function classifyWithFuse(
  uncategorizedTransactions: FormattedForReviewTransaction[],
  fuse: Fuse<Transaction>,
  validClassifications: Classification[],
  results: Record<string, ClassifiedElement[] | null>,
  noMatches: FormattedForReviewTransaction[],
  type: string
): Promise<void> {
  try {
    // Iterate over the 'For Review' transactions.
    for (const uncategorizedTransaction of uncategorizedTransactions) {
      try {
        // Use fuse to search for matches to the 'For Review' transaction's name in the list of saved transactions.
        const matches = fuse.search(uncategorizedTransaction.name);

        // Create a set of for the name of valid classification that have been found.
        const validClassificationsSet = new Set<string>();

        // Create a list to track the possible classifications.
        const validMatchedClassifications: ClassifiedElement[] = [];

        // Iterate through the matches found for the current 'For Review' transaction.
        for (const match of matches) {
          // Define the category name, then find its value based on the classification type.
          let classificationName;
          if (type === 'category') {
            classificationName = match.item.category;
          } else {
            classificationName = match.item.taxCodeName;
          }
          // Check if the set of classifications already contains that name.
          if (!validClassificationsSet.has(classificationName)) {
            // Check if the name is in the list of valid classification names.
            for (const classification of validClassifications) {
              if (classification.name === classificationName) {
                // Create a classified element for the element and push it to the valid matched classifications array.
                validMatchedClassifications.push({
                  type: type,
                  id: classification.id,
                  name: classificationName,
                  classifiedBy: 'Matching',
                });
                // Add the name to indicate not to add the classification again.
                validClassificationsSet.add(classificationName);
              }
            }
          }
        }

        if (validMatchedClassifications.length === 0) {
          // If no valid classifications are found, search for possible classifications in the database.
          const topTaxCodes = await getTopCategoriesForTransaction(
            uncategorizedTransaction.name,
            validClassifications
          );

          // If no possible classifications are found in the database, add the 'For Review' transaction to the noMatches array.
          if (topTaxCodes.length === 0) {
            noMatches.push(uncategorizedTransaction);
          } else {
            // Add the 'For Review' transaction and possible classifications to the results, and record it was classified by database.
            results[uncategorizedTransaction.transaction_ID] = topTaxCodes.map(
              (taxCode) => ({
                ...taxCode,
                type: type,
                classifiedBy: 'Database',
              })
            );
          }
        } else {
          // If matches were found, order them by closest average amount.
          const orderedClassifications = orderClassificationsByAmount(
            validMatchedClassifications,
            matches,
            uncategorizedTransaction,
            type
          );

          // Update the results record related to the current 'For Review' transactions ID with the ordered list of classified categories.
          // The lower the index of the classification, the better the amount matching.
          results[uncategorizedTransaction.transaction_ID] =
            orderedClassifications;
        }
        // Catch any errors and check for an error message.
      } catch (error) {
        // Return an appropriate message indicating an unexpected error.
        console.error(
          'Error mapping uncategorized transaction:',
          uncategorizedTransaction,
          error,
          '.'
        );
      }
    }
  } catch {
    console.error('Error loading fuse on transactions.');
  }
}

// Creates the a fuse instance on the passed transactions to be used in matching.
// Returns: A fuse object that can be used for classification.
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

// Averages amount of 'For Review' transactions by their classifications.
// Returns: an array of classifications and their difference ordered by closest value to real 'For Review' transaction amount.
function orderClassificationsByAmount(
  possibleValidElements: ClassifiedElement[],
  matches: FuseResult<Transaction>[],
  formattedTransaction: FormattedForReviewTransaction,
  type: string
): ClassifiedElement[] {
  try {
    // Assosiate classification name to a count of occurences and a total.
    const classificationAverages: Record<string, [number, number]> = {};

    // Initalize each classification as [0, 0].
    for (const classification of possibleValidElements) {
      classificationAverages[classification.name] = [0, 0];
    }

    // Iterate through the matches and check if they have a valid classification.
    matches.map((match) => {
      // Define the match classification for the current match and set its value based on classification type.
      let matchClassification;
      if (type === 'category') {
        matchClassification = match.item.category;
      } else {
        matchClassification = match.item.taxCodeName;
      }
      // Check if the match classification matches at least one name in the list of possible valid categories.
      if (
        possibleValidElements.some(
          (classification) => classification.name === matchClassification
        )
      ) {
        // Increment the number of matches for the classification and add the amount to the total.
        classificationAverages[matchClassification][0] += 1;
        // Use abs to account for possibility of expenses being recorded as positive or negitive.
        classificationAverages[matchClassification][1] += Math.abs(
          match.item.amount
        );
      }
    });

    // Make a map of the classifications with the count of their occurences and their total.
    const sortedClassificationAverages = Object.entries(classificationAverages)
      .map(([element, [count, total]]) => {
        // Define an average based on count and total, accounting for a potential count of 0.
        const average = count > 0 ? total / count : 0;
        // Define the difference from the 'For Review' transaction being predicted using absolute value.
        const difference = Math.abs(formattedTransaction.amount - average);
        // Return the differences to be sorted into an array of dictionaries containing the element and the difference.
        return { element, difference };
      })
      // Sort will put A before B if (A - B) is negitive, keep order if the same, and put B before A if positive.
      .sort((a, b) => a.difference - b.difference);

    // Create array for ordered predicted classification and extract just the classification values.
    const orderedClassifications = [];
    for (let index = 0; index < sortedClassificationAverages.length; index++) {
      // Get the classification name for that index and look for the matching classification object.
      const classificationName = sortedClassificationAverages[index].element;
      const matchingCategory = possibleValidElements.find(
        (classification) => classification.name === classificationName
      );
      // If a matching classification was found, push it into the ordered array of classifications.
      if (matchingCategory) {
        orderedClassifications.push(matchingCategory);
      }
    }

    return orderedClassifications;
  } catch (error) {
    // Catch any errors, log a message and return the passed classifications in the same order.
    if (error instanceof Error) {
      console.error('Error Ordering Classifications: ' + error.message);
    } else {
      console.error('Unexpected Error Ordering Classifications');
    }
    return possibleValidElements;
  }
}

// Helper method to classify 'For Review' transactions using the LLM API.
// Takes the array of unmatched 'For Review' transactions, the valid categories, the current classification results, and the company info.
// Returns: Does not return, instead modifing the passed arrays.
async function classifyCategoriesWithLLM(
  noMatches: FormattedForReviewTransaction[],
  validCategories: Classification[],
  results: Record<string, ClassifiedElement[]>,
  companyInfo: CompanyInfo
): Promise<void> {
  let llmApiResponse: ClassifiedResult[];
  try {
    // Call the LLM API with the array of matchless 'For Review' transactions, -
    // current results, the list of valid categories, the company info, and the type of classification.
    // The results are not used in category classification, but are passed due to their use in tax code classification.
    llmApiResponse = await batchQueryLLM(
      noMatches,
      results,
      validCategories,
      companyInfo,
      'category'
    );

    // If a response is received, iterate over the response data.
    if (llmApiResponse) {
      for (const llmResult of llmApiResponse) {
        // Add  the current LLM result to the results record for the related 'For Review'transaction and note it was classified by LLM API .
        results[llmResult.transaction_ID] =
          llmResult.possibleClassifications.map((category) => ({
            ...category,
            classifiedBy: 'LLM API',
          }));
      }
    }
  } catch (error) {
    // Catch any errors and log them to the console.
    if (error instanceof Error) {
      console.error(
        'Error from LLM API category classification: ',
        error.message
      );
    } else {
      console.error('Uncexpected Error From LLM API Category Classification');
    }
  }
}

// Helper method to classify 'For Review' transactions using the LLM API.
// Takes the array of unmatched 'For Review' transactions, the valid categories, the current classification and tax code results, and the company info.
// Returns: Does not return, instead modifing the passed arrays.
async function classifyTaxCodesWithLLM(
  noMatches: FormattedForReviewTransaction[],
  categoryResults: Record<string, ClassifiedElement[]>,
  validTaxCodes: Classification[],
  results: Record<string, ClassifiedElement[]>,
  companyInfo: CompanyInfo
): Promise<void> {
  let llmApiResponse: ClassifiedResult[];
  try {
    // Call the LLM API with the array of matchless 'For Review' transactions, current results, -
    // the list of valid categories, the company info, and the type of classification.
    // Category results are used as part of tax code prediction.
    llmApiResponse = await batchQueryLLM(
      noMatches,
      categoryResults,
      validTaxCodes,
      companyInfo,
      'tax code'
    );

    // If a response is received, iterate over the response data.
    if (llmApiResponse) {
      for (const llmResult of llmApiResponse) {
        // Add  the current LLM result to the results record for the related 'For Review' transaction and note it was classified by LLM API .
        results[llmResult.transaction_ID] =
          llmResult.possibleClassifications.map((category) => ({
            ...category,
            classifiedBy: 'LLM API',
          }));
      }
    }
  } catch (error) {
    // Catch any errors and log them to the console.
    if (error instanceof Error) {
      console.error(
        'Error from LLM API tax code classification: ',
        error.message
      );
    } else {
      console.error('Uncexpected Error From LLM API Tax Code Classification');
    }
  }
}
