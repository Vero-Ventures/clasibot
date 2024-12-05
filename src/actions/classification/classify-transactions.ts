'use server';

import Fuse from 'fuse.js';
import type { FuseResult } from 'fuse.js';

import {
  addDatabaseTransactions,
  searchDatabaseTransactionCategories,
  searchDatabaseTransactionTaxCodes,
} from '@/actions/db-transactions';

import { checkSubscription } from '@/actions/stripe';

import { batchQueryLLM } from '@/actions/llm-prediction/index';

import {
  getAccounts,
  getTaxCodes,
  getTaxCodesByLocation,
} from '@/actions/quickbooks/index';

import type {
  Account,
  Classification,
  ClassifiedElement,
  ClassifiedResult,
  CompanyInfo,
  FormattedForReviewTransaction,
  QueryResult,
  TaxCode,
  Transaction,
} from '@/types/index';

// Takes: A list of saved Classified Transactions, a list of unclassified 'For Review' transactions, -
//        The Company Info for use in LLM Classification, and the Company realm Id.
// Returns: A record that connects a 'For Review' transaction Id to an array of Classified Elements.
//    On error, instead returns an error object with an error message.
export async function classifyTransactions(
  classifiedTransactions: Transaction[],
  unclassifiedTransactions: FormattedForReviewTransaction[],
  companyInfo: CompanyInfo,
  realmId: string
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
    // Save the User Classified Transactions to the database for use in future Classification.
    const addTransactionsResult = await addDatabaseTransactions(
      classifiedTransactions
    );

    // Check if the Query Result from saving the Transactions function resulted in an error.
    if (addTransactionsResult.result === 'Error') {
      // On error Query Result log an error with the message and detail, then return an error object and message.
      console.error(
        'Error saving User Classified Transactions:',
        addTransactionsResult.message,
        ', Detail: ',
        addTransactionsResult.detail
      );
      return { error: 'Error saving User Classified Transactions.' };
    }
  } catch (error) {
    // Catch and log any errors saving the transactions, include the error message if it is present.
    if (error instanceof Error) {
      console.error(
        'Error saving existing Classified Transactions: ' + error.message
      );
    } else {
      console.error(
        'Unexpected Error Saving Existing Classified Transactions.'
      );
    }
    // Return an error object with an error message.
    return { error: 'Error saving existing Classified Transactions.' };
  }

  // Check the User Subscription status using the passed Company realm Id
  const subscriptionStatus = await checkSubscription(realmId);

  // If there is an error getting the SubLocation status or it is invalid, return an error object.
  if ('error' in subscriptionStatus) {
    return { error: 'Error getting User Subscription status.' };
  }
  if (!subscriptionStatus.valid) {
    return { error: 'No active User Subscription.' };
  }

  try {
    // Get the valid Categories for Classification from QuickBooks Expense Accounts using a Synthetic Login Tokens object.
    // Pass boolean value to indicate if names will be saved to database for proper name parsing of Categories.
    const validDBCategories: Classification[] =
      await fetchValidCategories(true);
    const validLLMCategories: Classification[] =
      await fetchValidCategories(false);

    // Get the valid Tax Codes for Classification using the Company Info location.
    // Also returns a value indicating if Tax Code Classification is possible for the Company (Canadian Companies only).
    const [classifyTaxCodes, validTaxCodes] =
      await fetchValidTaxCodes(companyInfo);

    // Create records that connect a 'For Review' transaction Id to an array of its Classified Elements.
    // Create a seperate record for tracking both Categories and Tax Codes.
    const categoryResults: Record<string, ClassifiedElement[]> = {};
    const taxCodeResults: Record<string, ClassifiedElement[]> = {};

    // Create an array for 'For Review' transactions with no Category matches and a list for 'For Review' transactions with no Tax Code matches.
    const noCategoryMatches: FormattedForReviewTransaction[] = [];
    const noTaxCodeMatches: FormattedForReviewTransaction[] = [];

    // Create a new Fuse instance with the Classified Transactions.
    // Used to match the 'For Review' transaction names to the the passed Classified Transaction objects.
    const fuse = createFuseInstance(classifiedTransactions);

    // Preform Fuse and database matching for the Category Classifications.
    await classifyWithFuse(
      unclassifiedTransactions,
      fuse,
      validDBCategories,
      categoryResults,
      noCategoryMatches,
      'category'
    );

    // Check if Tax Code Classification is possible and valid Tax Codes were found.
    if (classifyTaxCodes && validTaxCodes.length > 0) {
      // Preform Fuse and database matching for the Tax Code Classifications.
      await classifyWithFuse(
        unclassifiedTransactions,
        fuse,
        validTaxCodes,
        taxCodeResults,
        noTaxCodeMatches,
        'tax code'
      );
    }

    // Check if 'For Review' transactions are present in the noMatches array for Category Classification.
    if (noCategoryMatches.length > 0) {
      // Call the LLM to Classify the Categories of the unmatched 'For Review' transactions.
      await classifyCategoriesWithLLM(
        noCategoryMatches,
        validLLMCategories,
        categoryResults,
        companyInfo
      );
    }

    // Check if 'For Review' transactions are present in the noMatches array for Tax Code Classification.
    if (noTaxCodeMatches.length > 0 && classifyTaxCodes) {
      // Call the LLM to Classify the Tax Codes of the unmatched 'For Review' transactions.
      await classifyTaxCodesWithLLM(
        noTaxCodeMatches,
        categoryResults,
        validTaxCodes,
        taxCodeResults,
        companyInfo
      );
    }

    // Create a record to track arrays of the Classified Elements for a 'For Review' transaction.
    // Values in the record are nullable to handle failed or disallowed Classification.
    const classificationResults: Record<
      string,
      {
        category: ClassifiedElement[] | null;
        taxCode: ClassifiedElement[] | null;
      }
    > = {};

    // Iterate through the passed 'For Review' transactions.
    for (const transaction of unclassifiedTransactions) {
      // Define a new object ot be stored in the results array for the current 'For Review' transaction null.
      // Values are initally set to null to account for failed or disallowed Classification.
      const transactionResults: {
        category: ClassifiedElement[] | null;
        taxCode: ClassifiedElement[] | null;
      } = {
        category: null,
        taxCode: null,
      };

      // Check the Category and Tax Code Classification records using the 'For Review' transaction Id.
      // Updates the related Classification in the 'For Review' transaction results object.
      if (categoryResults[transaction.transaction_Id]) {
        transactionResults.category =
          categoryResults[transaction.transaction_Id];
      }
      if (taxCodeResults[transaction.transaction_Id]) {
        transactionResults.taxCode = taxCodeResults[transaction.transaction_Id];
      }

      // Set the Classification results record with the object for the current 'For Review' transaction.
      // Connects the (possibly null) arrays of Classified Elements to the 'For Review' transaction Id.
      classificationResults[transaction.transaction_Id] = transactionResults;
    }

    // Return the Classification results record for the 'For Review' transactions.
    return classificationResults;
  } catch (error) {
    // Catch and log any errors, include the error message if it is present.
    if (error instanceof Error) {
      console.error('Error Classifying New Transactions: ' + error.message);
    } else {
      console.error('Unexpected Classifying New Transactions.');
    }
    // Return an error object with an error message.
    return { error: 'Unexpected error Classifying Transactions.' };
  }
}

// Finds and uses the User Expense Acccounts to find the possible Categories a Transaction can be connected to.
// Takes: A boolean value indicating how Account names are parsed.
// Returns: An array of Classification objects for the valid Catagories from the User Expense Accounts.
async function fetchValidCategories(
  filterToBase: boolean
): Promise<Classification[]> {
  try {
    // Gets a list of valid Category Accounts from QuickBooks using the 'Expense' Accounts type.
    const validCategoriesResult = await getAccounts('Expense');

    // Check if the Account fetch Query Result resulted in an error.
    if ((validCategoriesResult[0] as QueryResult).result === 'Error') {
      // On error Query Result log an error with the message and detail.
      console.error(
        (validCategoriesResult[0] as QueryResult).message +
          ', Detail: ' +
          (validCategoriesResult[0] as QueryResult).detail
      );
      // On error fetching Accounts, return an empty array of Classifications.
      return [];
    }

    // Check if the Category names need to be filtered prior to being returned.
    if (filterToBase) {
      // User info is not stored for security, so only base Category names are saved to the database.
      // Therefore the Account names are filtered before returning to methods that use database matching.
      return (validCategoriesResult.slice(1) as Account[]).map(
        (category: Account): Classification => {
          return {
            type: 'classification',
            id: category.id,
            name: category.account_sub_type,
          };
        }
      );
    } else {
      // If database matching is not being used, return the full Account name for greater prediction accuracy.
      return (validCategoriesResult.slice(1) as Account[]).map(
        (category: Account): Classification => {
          return {
            type: 'classification',
            id: category.id,
            name: category.name,
          };
        }
      );
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

// Finds and uses the User Tax Codes to find the possible Tax Codes a Transaction can be connected to.
// Takes: Company Info containing the Company location.
// Returns: An array of Classification objects for the valid user Tax Codes for their location.
async function fetchValidTaxCodes(
  companyInfo: CompanyInfo
): Promise<[boolean, Classification[]]> {
  try {
    // Define boolean value to track if Tax Code Classification is possible for the Company.
    let classifyTaxCode = false;

    // Define an array to store Tax Codes that can be used in Classification.
    const taxCodes: Classification[] = [];

    // Check if Tax Code Classification is possible by locational check on Company Info.
    // Presently only allow Canadian Companies with a valid Sub-location.
    if (
      companyInfo.location.Country === 'CA' &&
      companyInfo.location.SubLocation
    ) {
      classifyTaxCode = true;
      // Use the Synthetic Login Tokens and Company realm Id to get the Company Tax Codes.
      const userTaxCodes = await getTaxCodes();

      // Fetch the list of potentially valid Tax Codes for the Company using their Sub-location.
      const validLocationalTaxCodes = await getTaxCodesByLocation(
        companyInfo.location.SubLocation
      );

      // Check the fetch for the Company Tax Codes was a success.
      if ((userTaxCodes[0] as QueryResult).result === 'Error') {
        // If an error occured fetching the Tax Codes, log the message and detail from the Query Result.
        console.error(
          'Error getting Tax Codes, Message: ' +
            (userTaxCodes[0] as QueryResult).message +
            ', Detail: ' +
            (userTaxCodes[0] as QueryResult).detail
        );
      } else {
        // Extract the Company Tax Codes from the result by removing the Query Result from the first index.
        const userTaxCodeArray = userTaxCodes.slice(1) as TaxCode[];

        // Iterate through Company Tax Codes to check for and record valid Tax Codes.
        for (const taxCode of userTaxCodeArray) {
          // If the current Company Tax Code name is contained in the list of valid Tax Codes, push it to the array of Tax Codes.
          if (validLocationalTaxCodes.includes(taxCode.Name)) {
            taxCodes.push({
              type: 'tax code',
              name: taxCode.Name,
              id: taxCode.Id,
            });
          }
        }
      }
    }

    // Return if Tax Code Classification is possible and the related valid Tax Codes as an array of Classified Elements.
    // If an error occured fetching the Tax Codes, the empty array created to store the Tax Codes will be returned instead.
    return [classifyTaxCode, taxCodes];
  } catch (error) {
    // Catch and log any errors, include the error message if it is present.
    if (error instanceof Error) {
      console.error('Error Getting Tax Code Classifications: ' + error.message);
    } else {
      console.error('Unexpected Error Getting Tax Code Classifications.');
    }
    // On error, indicate Tax Code Classification is not possible and return an empty array.
    return [false, []];
  }
}

// Creates Classified 'For Review' transactions using the passed unclassified 'For Review' transactions and an array of valid Classifications.
// Uses Fuse for matching against saved Classified Transactions and a type value to identify the Classification type.
// Takes: An array pf 'For Review' transactions, Fuse object for matching with saved Classified Transactions, valid Classifications, -
//        A results record to append the results to, an array for unmatched 'For Review' transactions, and the Classification type as a string.
// Returns: Does not return, instead modifies the passed results and 'no matches' arrays.
async function classifyWithFuse(
  unclassifiedTransactions: FormattedForReviewTransaction[],
  fuse: Fuse<Transaction>,
  validClassifications: Classification[],
  results: Record<string, ClassifiedElement[] | null>,
  noMatches: FormattedForReviewTransaction[],
  type: string
): Promise<void> {
  try {
    // Iterate over the passed 'For Review' transactions.
    for (const unclassifiedTransaction of unclassifiedTransactions) {
      try {
        // Use Fuse to search for saved Classified Transactions matching the current 'For Review' transaction name.
        const matches = fuse.search(unclassifiedTransaction.name);

        // Create a set for the name of valid Classifications that have been found.
        const validMatchedClassificationsSet = new Set<string>();

        // Create an array to contain the possible Classifications.
        const validMatchedClassifications: ClassifiedElement[] = [];

        // Iterate through the Transaction matches found for the current 'For Review' transaction.
        for (const match of matches) {
          // Define the Classification name, then extract its value from the match using the Classification type.
          let classificationName;
          if (type === 'category') {
            classificationName = match.item.category;
          } else {
            classificationName = match.item.taxCodeName;
          }

          // Check if the set of Matched and Valid Classifications already contains the Classification name.
          // Checking against the set prevents Classifications from being added multiple times by different matches.
          if (!validMatchedClassificationsSet.has(classificationName)) {
            // Iterate through the list of Valid Classification names to see if it contains the Classification name.
            // Ensures that only Classifications with valid names that are not already in the Matched and Valid Set are recorded.
            for (const classification of validClassifications) {
              if (classification.name === classificationName) {
                // Create a Classified Element for the Classification and push it to array of Valid Matched Classifications.
                // Record the method of Classification as 'Matching'.
                validMatchedClassifications.push({
                  type: type,
                  id: classification.id,
                  name: classificationName,
                  classifiedBy: 'Matching',
                });
                // Add the name to the set of Valid and Matched Classifications to prevent the it from being added again by other matches.
                validMatchedClassificationsSet.add(classificationName);
              }
            }
          }
        }
        // If no valid Classifications are found, search for possible Classifications in the database.
        if (validMatchedClassifications.length === 0) {
          // Define the value to store the array of possibile Classification name and Id.
          // Get the Classifications from the database depending on the Classification type
          let topClassifications;
          if (type === 'category') {
            topClassifications = await searchDatabaseTransactionCategories(
              unclassifiedTransaction.name,
              validClassifications
            );
          } else {
            topClassifications = await searchDatabaseTransactionTaxCodes(
              unclassifiedTransaction.name,
              validClassifications
            );
          }

          // If no Classifications were found in the database, add the 'For Review' transaction to the array of unmatched 'For Review' transactions.
          if (topClassifications.length === 0) {
            noMatches.push(unclassifiedTransaction);
          } else {
            // Add the 'For Review' transaction and its possible Classifications to the results record.
            // Record the method of Classification as 'Database'.
            results[unclassifiedTransaction.transaction_Id] =
              topClassifications.map((classification) => ({
                ...classification,
                type: type,
                classifiedBy: 'Database',
              }));
          }
        } else {
          // If valid matching Classifications were found, order them by closest average Transaction amount.
          const orderedClassifications = orderClassificationsByAmount(
            validMatchedClassifications,
            matches,
            unclassifiedTransaction,
            type
          );

          // Set the results record for the current 'For Review' transaction to the ordered list of Classifications.
          // The lower the index of the Classification, the better the Classification matches.
          results[unclassifiedTransaction.transaction_Id] =
            orderedClassifications;
        }
      } catch (error) {
        // Catch any errors and log a message for the current 'For Review' transaction.
        // Include the error message if it is present.
        if (error instanceof Error) {
          console.error(
            'Error mapping unclassified transaction:',
            unclassifiedTransaction,
            error.message,
            '.'
          );
        } else {
          console.error(
            'Error mapping unclassified transaction:',
            unclassifiedTransaction,
            ', Unexpected Error.'
          );
        }
      }
    }
  } catch (error) {
    // Catch and log any errors, include the error message if it is present.
    if (error instanceof Error) {
      console.error('Error loading Fuse on transactions: ' + error.message);
    } else {
      console.error('Unexpected error loading Fuse on transactions.');
    }
  }
}

// Creates the a Fuse instance on the passed Transactions to be used in matching.
// Takes: An array of Saved Classified Transactions to allow matching against.
// Returns: A Fuse object that can be used for Classification.
function createFuseInstance(
  categorizedTransactions: Transaction[]
): Fuse<Transaction> {
  // Create and return a Fuse object with a set of defined parameters.
  return new Fuse(categorizedTransactions, {
    includeScore: true,
    threshold: 0.3,
    keys: ['name'],
  });
}

// Averages the Transaction amounts of 'For Review' transactions to order its Classifications.
// Takes: An array of the possible Valid Matched Classifications, the matched Saved Classifications Transactions
//        The formatted 'For Review' transaction, and the Classification type.
// Returns: An array of Classified Elements ordered by the 'For Review' transaction amount.
function orderClassificationsByAmount(
  possibleValidElements: ClassifiedElement[],
  matches: FuseResult<Transaction>[],
  formattedTransaction: FormattedForReviewTransaction,
  type: string
): ClassifiedElement[] {
  try {
    // Create a record to connect Classification names to a count of occurrences and a total amount.
    const classificationAverages: Record<string, [number, number]> = {};

    // Initalize each Classification as [0, 0] (0 Occurences, 0 Total Amount).
    for (const classification of possibleValidElements) {
      classificationAverages[classification.name] = [0, 0];
    }

    // Iterate through the matched Transactions.
    matches.map((match) => {
      // Define the Classifications for the current match and set its value based on the Classification type.
      let matchClassification;
      if (type === 'category') {
        matchClassification = match.item.category;
      } else {
        matchClassification = match.item.taxCodeName;
      }

      // Check if the match Classification is in the list of Matched Valid Classifications.
      if (
        possibleValidElements.some(
          (classification) => classification.name === matchClassification
        )
      ) {
        // Increment the number of occurrences for the Classification and add the amount to the total.
        classificationAverages[matchClassification][0] += 1;
        classificationAverages[matchClassification][1] += match.item.amount;
      }
    });

    // Map over the Classifications to create an array of objects with a Classification and a difference value.
    const sortedClassificationDifferences = Object.entries(
      classificationAverages
    )
      // Define the Classification name and an array with [number of occurrences, total amount].
      .map(([classification, [occurrences, total]]) => {
        // Define an average based on occurrences and total, accounting for a potential occurrences value of 0.
        const average = occurrences > 0 ? total / occurrences : 0;
        // Define the difference from the 'For Review' transaction using absolute value.
        const difference = Math.abs(formattedTransaction.amount - average);
        // Return Classification and its average difference from the 'For Review' transaction.
        return { classification, difference };
      })
      // Sort all of the returned Classifications to the lowest differences are higher.
      .sort((a, b) => a.difference - b.difference);

    // Create array for ordered Classifications and extract just the Classification values.
    const orderedClassifications = [];
    // Iterate through the sortedClassificationAverages to get the Classification order.
    // Order of index is the sorted order and the order they are added to the ordered Classifications array.
    for (
      let index = 0;
      index < sortedClassificationDifferences.length;
      index++
    ) {
      // Get the Classification name for the current index and find the matching Classification object.
      const classificationName =
        sortedClassificationDifferences[index].classification;
      const matchingCategory = possibleValidElements.find(
        (classification) => classification.name === classificationName
      );
      // If a matching Classification was found, push it into the ordered array of Classifications.
      if (matchingCategory) {
        orderedClassifications.push(matchingCategory);
      }
    }
    // Return the array of ordered Classifications
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

// Helper method to Classify 'For Review' transaction Categories using the LLM API.
// Takes: The array of unmatched 'For Review' transactions, the valid Categories,
//        The current Classification results array, and the Company Info.
// Returns: Does not return, instead modifies the passed results array.
async function classifyCategoriesWithLLM(
  noMatches: FormattedForReviewTransaction[],
  validCategories: Classification[],
  results: Record<string, ClassifiedElement[]>,
  companyInfo: CompanyInfo
): Promise<void> {
  let llmApiResponse: ClassifiedResult[];
  try {
    // Call the LLM API with the array of unmatched 'For Review' transactions, -
    // The list of valid Categories, the Company Info, and the type of Classification.
    llmApiResponse = await batchQueryLLM(
      noMatches,
      validCategories,
      companyInfo,
      'category'
    );

    // If a response is received from the LLM, iterate over the response data.
    if (llmApiResponse) {
      for (const llmResult of llmApiResponse) {
        // Add the LLM Category Classification for the current 'For Review' transaction to the results record.
        // Record the method of Classification as 'LLM API'.
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
        'Error from LLM API Category Classification: ',
        error.message
      );
    } else {
      console.error('Uncexpected Error From LLM API Category Classification');
    }
  }
}

// Helper method to Classify 'For Review' transaction Tax Codes using the LLM API.
// Takes: The array of unmatched 'For Review' transactions, the results of the Category Classification
//        The valid Tax Codes, The current Classification results array, and the Company Info.
// Returns: Does not return, instead modifies the passed results array.
async function classifyTaxCodesWithLLM(
  noMatches: FormattedForReviewTransaction[],
  categoryResults: Record<string, ClassifiedElement[]>,
  validTaxCodes: Classification[],
  results: Record<string, ClassifiedElement[]>,
  companyInfo: CompanyInfo
): Promise<void> {
  let llmApiResponse: ClassifiedResult[];
  try {
    // Call the LLM API with the array of unmatched 'For Review' transactions, the list of valid Tax Codes, -
    // The Company Info, the type of Classification, and the Category Classifications -.
    // The Category Classifications are used as part of Tax Code prediction.
    llmApiResponse = await batchQueryLLM(
      noMatches,
      validTaxCodes,
      companyInfo,
      'tax code',
      categoryResults
    );

    // If a response is received from the LLM, iterate over the response data.
    if (llmApiResponse) {
      for (const llmResult of llmApiResponse) {
        // Add the LLM Tax Code Classification for the current 'For Review' transaction to the results record.
        // Record the method of Classification as 'LLM API'.
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
        'Error from LLM API Tax Code Classification: ',
        error.message
      );
    } else {
      console.error('Uncexpected Error From LLM API Tax Code Classification');
    }
  }
}
