'use server';
import Fuse from 'fuse.js';
import type { FuseResult } from 'fuse.js';
import {
  addTransactions,
  getTopCategoriesForTransaction,
  getTopTaxCodesForTransaction,
} from '@/actions/db-transactions';
import { getAccounts } from '@/actions/quickbooks/get-accounts';
import { getTaxCodes, getTaxCodesByLocation } from '@/actions/quickbooks/taxes';
import { batchQueryLLM } from '@/actions/backend-actions/llm-prediction/llm';
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

// Takes: A list of saved Transactions a list of uncategorized 'For Review' transactions, -
//        A set of synthetic Login Tokens, and the Company Info for Tax Codes and LLM Classification.
// Returns: A record that connects a transaction Id to an array of Classified elements for bothe Categories and Tax Codes.
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
    // Save the User saved (Classified) Transactions to the database for DB Classification.
    const result = await addTransactions(categorizedTransactions);

    // Check the Query Result returned by the add Transactions function resulted in an error.
    // Return its message and detail an error Query Result is found.
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
    // Catch and log any errors, include the error message if it is present.
    if (error instanceof Error) {
      console.error(
        'Error saving existing classified transactions: ' + error.message
      );
    } else {
      console.error(
        'Unexpected Error Saving Existing Classified Transactions.'
      );
    }
    // Return an error object with an error message.
    return { error: 'Error saving existing classified transactions.' };
  }

  // Check the User subscription status using the passed Company realm Id
  // If there is an error or the subscription status is invalud, return an error object.
  const subscriptionStatus = await checkSubscription(companyId);
  if ('error' in subscriptionStatus) {
    return { error: 'Error getting user subscription status.' };
  }
  if (!subscriptionStatus.valid) {
    return { error: 'No active user subscription.' };
  }

  try {
    // Get valid Categories from QuickBooks (Categories present in the Companies Account) using synthetic session.
    // Fetch parsed names for DB useage. (DB saves Transactions with base names to avoid identifing User information).
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

    // Get use the location from the Company Info to get the valid Tax Codes.
    const [classifyTaxCodes, validTaxCodes] = await fetchValidTaxCodes(
      companyInfo,
      loginTokens,
      companyId
    );

    // Create dictionaries that ties strings (Transaction Id's) to a list of Categories and a list of Tax Codes.
    const categoryResults: Record<string, ClassifiedElement[]> = {};
    const taxCodeResults: Record<string, ClassifiedElement[]> = {};

    // Create an array for 'For Review' transactions with no Category matches and a list for 'For Review' transactions with no Tax Code matches.
    const noCategoryMatches: FormattedForReviewTransaction[] = [];
    const noTaxCodeMatches: FormattedForReviewTransaction[] = [];

    // Use a helper method to create a new Fuse instance with the Categorized Transactions.
    const fuse = createFuseInstance(categorizedTransactions);

    // Preform the first two levels of Category Classification with Fuse and database matching.
    await classifyWithFuse(
      uncategorizedTransactions,
      fuse,
      validDBCategories,
      categoryResults,
      noCategoryMatches,
      'category'
    );

    // Check if Tax Code Classification is possible.
    if (classifyTaxCodes) {
      // Preform the first two levels of Tax Code Classification with Fuse and database matching.
      await classifyWithFuse(
        uncategorizedTransactions,
        fuse,
        validTaxCodes,
        taxCodeResults,
        noTaxCodeMatches,
        'tax code'
      );
    }

    // If there are 'For Review' transactions present in the noMatches array for Categories, send them to the LLM API.
    // This Categorizes 'For Review' transactions that failed the first two Categorization methods.
    if (noCategoryMatches.length > 0) {
      await classifyCategoriesWithLLM(
        noCategoryMatches,
        validLLMCategories,
        categoryResults,
        companyInfo
      );
    }

    // If there were no Tax Code matches and Tax Code Classification is valid, send them to the LLM API.
    if (noTaxCodeMatches.length > 0 && classifyTaxCodes) {
      await classifyTaxCodesWithLLM(
        noTaxCodeMatches,
        categoryResults,
        validTaxCodes,
        taxCodeResults,
        companyInfo
      );
    }

    // Create an object to track the results in relation to the 'For Review' transaction Id.
    // Nullable values allow for failed predictions or for the skipped Tax Code predictions on a non-CA User.
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

      // Check for results in the Category and Tax Code results. Record the value to the related field in the results if present.
      if (categoryResults[transaction.transaction_Id]) {
        newResults.category = categoryResults[transaction.transaction_Id];
      }
      if (taxCodeResults[transaction.transaction_Id]) {
        newResults.taxCode = taxCodeResults[transaction.transaction_Id];
      }

      // Update the record of results with the 'For Review' transactions Classification results connected to its Id.
      combinedResults[transaction.transaction_Id] = newResults;
    }

    // Return the results record connecting 'For Review' transaction Id's to their results objects.
    return combinedResults;
  } catch (error) {
    // Catch and log any errors, include the error message if it is present.
    if (error instanceof Error) {
      console.error('Error Classifying New Transactions: ' + error.message);
    } else {
      console.error('Unexpected Classifying New Transactions.');
    }
    // Return an error object with an error message.
    return { error: 'Uncexpected error classifying transaction.' };
  }
}

// Helper method to fetch User Categories from QuickBooks and filters to base Category if needed.
// Takes a boolean to indicate filtering and a synthetic session.
// Returns: An array of Classification objects for the catagories in the User expense Accounts.
async function fetchValidCategories(
  filterToBase: boolean,
  loginTokens: LoginTokens,
  companyId: string
): Promise<Classification[]> {
  try {
    // Gets a list of valid Categories by getting the User 'Expense' type Accounts.
    const validCategoriesResult = JSON.parse(
      await getAccounts('Expense', loginTokens, companyId)
    );

    // Check if the Account fetch query result resulted in an error.
    if (validCategoriesResult[0].result === 'Error') {
      // Log an error for failure catching using the Query Result.
      console.error(
        validCategoriesResult[0].message +
          ', Detail: ' +
          validCategoriesResult[0].detail
      );
      // On fetch error, return an empty array of Classifications.
      return [];
    }

    // Check if the Categories need to be filtered prior to being returned.
    if (filterToBase) {
      // User info is not stored for security so the database uses only the base Category value.
      // Therefore, filtering to the base Category is needed in database matching steps.
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
      // LLM data is not saved so it can use the full Category name.
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
  } catch (error) {
    // Catch and log any errors, include the error message if it is present.
    if (error instanceof Error) {
      console.error('Error Getting Category Classifications: ' + error.message);
    } else {
      console.error('Unexpected Error Getting Category Classifications.');
    }
    // On error, return an empty Classification array.
    return [];
  }
}

// Helper method to fetch User Tax Codes from QuickBooks and filter to the ones applicable for the Companies location.
// Takes the Company Info for the location and a synthetic session.
// Returns: An array of Classification objects for the Tax Codes in the Companies location.
async function fetchValidTaxCodes(
  companyInfo: CompanyInfo,
  loginTokens: LoginTokens,
  companyId: string
): Promise<[boolean, Classification[]]> {
  try {
    // Define variable to inform caller if Tax Code Classification is doable for the User.
    let classifyTaxCode = false;
    // Define an array to store Tax Codes to be used in Classification.
    const taxCodes: Classification[] = [];

    // Check if Tax Code Classification is possible by locational check on Company Info.
    // Presently only allow Canadian Companies with a valid sub-location.
    if (
      companyInfo.location.Country === 'CA' &&
      companyInfo.location.SubLocation
    ) {
      // Set Tax Codes Classification to be valid, then use the passed synthetic session to get the User Tax Codes.
      classifyTaxCode = true;
      const userTaxCodes = JSON.parse(
        await getTaxCodes(loginTokens, companyId)
      );

      // Also fetch the valid Tax Codes for a User by their sub-location.
      const validLocationalTaxCodes = await getTaxCodesByLocation(
        companyInfo.location.SubLocation
      );

      // Check there are valid Tax Codes (error check) and the Query Result from getting User Tax Codes was a success.
      if (
        validLocationalTaxCodes.length !== 0 &&
        userTaxCodes[0].result != 'Success'
      ) {
        // Extract the User Tax Codes from the result by removing the query result
        const userTaxCodeArray = userTaxCodes[0].slice(1) as TaxCode[];

        // Iterate through User Tax Codes to record valid Tax Code info.
        for (const taxCode of userTaxCodeArray) {
          // If the current Tax Code name is one of the valid locational Tax Codes, push it to the array of Tax Codes.
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
    // Return an array indicating if tax Classification is possible and a (possibly empty) array of Tax Code Classifications.
    return [classifyTaxCode, taxCodes];
  } catch (error) {
    // Catch and log any errors, include the error message if it is present.
    if (error instanceof Error) {
      console.error('Error Getting Tax Code Classifications: ' + error.message);
    } else {
      console.error('Unexpected Error Getting Tax Code Classifications.');
    }
    // On error, indicate Classification is not possible and return an empty array.
    return [false, []];
  }
}

// Helper method to Classify 'For Review' transactions using fuse and database matching.
// Takes uncategorized 'For Review' transactions, fuse object for matching 'For Review' transactions, valid Classifications, -
// a results records, array of 'For Review' transactions with no matches, and Classification type.
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

        // Create a set of for the name of valid Classification that have been found.
        const validClassificationsSet = new Set<string>();

        // Create a list to track the possible Classifications.
        const validMatchedClassifications: ClassifiedElement[] = [];

        // Iterate through the matches found for the current 'For Review' transaction.
        for (const match of matches) {
          // Define the category name, then find its value based on the Classification type.
          let classificationName;
          if (type === 'category') {
            classificationName = match.item.category;
          } else {
            classificationName = match.item.taxCodeName;
          }
          // Check if the set of Classifications already contains that name.
          if (!validClassificationsSet.has(classificationName)) {
            // Check if the name is in the list of valid Classification names.
            for (const classification of validClassifications) {
              if (classification.name === classificationName) {
                // Create a Classified element for the element and push it to the valid matched Classifications array.
                validMatchedClassifications.push({
                  type: type,
                  id: classification.id,
                  name: classificationName,
                  classifiedBy: 'Matching',
                });
                // Add the name to indicate not to add the Classification again.
                validClassificationsSet.add(classificationName);
              }
            }
          }
        }

        if (validMatchedClassifications.length === 0) {
          // If no valid Classifications are found, search for possible Classifications in the database.
          let topClassifications;
          if (type === 'category') {
            topClassifications = await getTopCategoriesForTransaction(
              uncategorizedTransaction.name,
              validClassifications
            );
          } else {
            topClassifications = await getTopTaxCodesForTransaction(
              uncategorizedTransaction.name,
              validClassifications
            );
          }

          // If no possible Classifications are found in the database, add the 'For Review' transaction to the noMatches array.
          if (topClassifications.length === 0) {
            noMatches.push(uncategorizedTransaction);
          } else {
            // Add the 'For Review' transaction and possible Classifications to the results, and record it was Classified by database.
            results[uncategorizedTransaction.transaction_Id] =
              topClassifications.map((classification) => ({
                ...classification,
                type: type,
                classifiedBy: 'Database',
              }));
          }
        } else {
          // If matches were found, order them by closest average amount.
          const orderedClassifications = orderClassificationsByAmount(
            validMatchedClassifications,
            matches,
            uncategorizedTransaction,
            type
          );

          // Update the results record related to the current 'For Review' transactions Id with the ordered list of Classified Categories.
          // The lower the index of the Classification, the better the amount matching.
          results[uncategorizedTransaction.transaction_Id] =
            orderedClassifications;
        }
      } catch (error) {
        // Catch any errors and log a message for the current 'For Review' transaction.
        console.error(
          'Error mapping uncategorized transaction:',
          uncategorizedTransaction,
          error,
          '.'
        );
      }
    }
  } catch {
    // Catch any errors and log an error message.
    console.error('Error loading fuse on transactions.');
  }
}

// Creates the a fuse instance on the passed Transactions to be used in matching.
// Returns: A fuse object that can be used for Classification.
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

// Averages amount of 'For Review' transactions by their Classifications.
// Returns: an array of Classifications and their difference ordered by closest value to real 'For Review' transaction amount.
function orderClassificationsByAmount(
  possibleValidElements: ClassifiedElement[],
  matches: FuseResult<Transaction>[],
  formattedTransaction: FormattedForReviewTransaction,
  type: string
): ClassifiedElement[] {
  try {
    // Assosiate Classification name to a count of occurences and a total.
    const classificationAverages: Record<string, [number, number]> = {};

    // Initalize each Classification as [0, 0].
    for (const classification of possibleValidElements) {
      classificationAverages[classification.name] = [0, 0];
    }

    // Iterate through the matches and check if they have a valid Classification.
    matches.map((match) => {
      // Define the match Classifications for the current match and set its value based on Classification type.
      let matchClassification;
      if (type === 'category') {
        matchClassification = match.item.category;
      } else {
        matchClassification = match.item.taxCodeName;
      }
      // Check if the match Classification matches at least one name in the list of possible valid Categories.
      if (
        possibleValidElements.some(
          (classification) => classification.name === matchClassification
        )
      ) {
        // Increment the number of matches for the Classification and add the amount to the total.
        classificationAverages[matchClassification][0] += 1;
        // Use absolute value to account for possibility of expenses being recorded as positive or negitive.
        classificationAverages[matchClassification][1] += Math.abs(
          match.item.amount
        );
      }
    });

    // Make a map of the Classifications with the count of their occurences and their total.
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

    // Create array for ordered predicted Classification and extract just the Classification values.
    const orderedClassifications = [];
    for (let index = 0; index < sortedClassificationAverages.length; index++) {
      // Get the Classification name for that index and look for the matching Classification object.
      const classificationName = sortedClassificationAverages[index].element;
      const matchingCategory = possibleValidElements.find(
        (classification) => classification.name === classificationName
      );
      // If a matching Classification was found, push it into the ordered array of Classifications.
      if (matchingCategory) {
        orderedClassifications.push(matchingCategory);
      }
    }

    return orderedClassifications;
  } catch (error) {
    // Catch and log any errors, include the error message if it is present.
    if (error instanceof Error) {
      console.error('Error Ordering Classifications: ' + error.message);
    } else {
      console.error('Unexpected Error Ordering Classifications');
    }
    // Return the passed Classifications in the same order.
    return possibleValidElements;
  }
}

// Helper method to Classify 'For Review' transactions using the LLM API.
// Takes the array of unmatched 'For Review' transactions, the valid Categories, the current Classification results, and the Company Info.
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
    // current results, the list of valid Categories, the Company Info, and the type of Classification.
    // The results are not used in Category Classification, but are passed due to their use in Tax Code Classification.
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
        // Add  the current LLM result to the results record for the related 'For Review'transaction and note it was Classified by LLM API .
        results[llmResult.transaction_Id] =
          llmResult.possibleClassifications.map((category) => ({
            ...category,
            classifiedBy: 'LLM API',
          }));
      }
    }
  } catch (error) {
    // Catch any errors and log them to the console. Include the error message if it is present.
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

// Helper method to Classify 'For Review' transactions using the LLM API.
// Takes the array of unmatched 'For Review' transactions, the valid Categories, the current Classification and Tax Code results, and the Company Info.
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
    // the list of valid Categories, the Company Info, and the type of Classification.
    // Category results are used as part of Tax Code prediction.
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
        // Add  the current LLM result to the results record for the related 'For Review' transaction and note it was Classified by LLM API .
        results[llmResult.transaction_Id] =
          llmResult.possibleClassifications.map((category) => ({
            ...category,
            classifiedBy: 'LLM API',
          }));
      }
    }
  } catch (error) {
    // Catch any errors and log them to the console. Include the error message if it is present.
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
