'use server';

import { checkConfidenceValue } from '@/actions/check-confidence-value';

import { addForReviewTransactions } from '@/actions/backend-actions/database-functions/index';

import {
  getAccounts,
  getForReview,
  getSavedTransactions,
  getCompanyIndustry,
  getCompanyLocation,
  getCompanyName,
} from '@/actions/quickbooks/index';

import { classifyTransactions } from './index';

import type {
  Account,
  ClassifiedElement,
  CompanyInfo,
  ForReviewTransaction,
  FormattedForReviewTransaction,
  ClassifiedForReviewTransaction,
  LoginTokens,
  QueryResult,
  Transaction,
} from '@/types/index';

// Classifies and saves the 'For Review' transactions for a specific Company.
// Takes: A set of synthetic Login Tokens and the realm Id of the Company.
// Returns: The Query Result from 'For Review' transaction saving function or an error Query Result.
export async function classifyCompany(
  loginTokens: LoginTokens,
  companyId: string
): Promise<QueryResult> {
  try {
    // Get the 'For Review' transactions for all Accounts related to the current Company.
    const forReviewResult = await getForReviewTransactions(
      loginTokens,
      companyId
    );

    // Check if the 'For Review' transaction call encountered an error.
    // Result is only present in Query Result typing (only returned on error).
    if ('result' in forReviewResult) {
      // Return the error Query Result.
      return forReviewResult;
    }

    // Define the fetched 'For Review' transactions as an array of Sub-arrays.
    // Interal array format is [FormattedForReviewTransaction, ForReviewTransaction] for each 'For Review' transaction.
    const forReviewTransactions = forReviewResult as (
      | ForReviewTransaction
      | FormattedForReviewTransaction
    )[][];

    // Get the saved Classified Transactions from the User to use as context for prediction.
    const classifiedPastTransactions = await getClassifiedPastTransactions();

    // Extract the formatted 'For Review' transactions to use in Classification.
    const formattedForReviewTransactions = forReviewTransactions.map(
      (subArray) => subArray[0] as FormattedForReviewTransaction
    );

    // Get Company Info for the User as context during LLM predictions.
    const companyInfo = await getCompanyInfo();

    // Call Classification function on the formatted 'For Review' transactions.
    const classificationResults:
      | Record<
          string,
          {
            category: ClassifiedElement[] | null;
            taxCode: ClassifiedElement[] | null;
          }
        >
      | { error: string } = await classifyTransactions(
      classifiedPastTransactions,
      formattedForReviewTransactions,
      companyInfo,
      companyId
    );

    // Check for error object returned by the Classification call.
    if (classificationResults.error) {
      // Return the error object as the detail of an 'Error' Query Result.
      const resultDetail = classificationResults.error as string;
      return {
        result: 'Error',
        message: 'Error Classifying The New Transactions',
        detail: resultDetail,
      };
    } else {
      // Define the the format of the Classification results after error check.
      const validClassificationResults = classificationResults as Record<
        string,
        {
          category: ClassifiedElement[] | null;
          taxCode: ClassifiedElement[] | null;
        }
      >;

      // Use Classification results to create Classified 'For Review' transaction objects.
      const classifiedForReviewTransactions =
        await createClassifiedForReviewTransactions(
          forReviewTransactions,
          validClassificationResults
        );

      // Check if the number of Classified 'For Review' transactions is less than the number of passed 'For Review' transactions.
      if (
        classifiedForReviewTransactions.length < forReviewTransactions.length
      ) {
        // Fewer returned 'For Review' transactions means the Classified 'For Review' transaction creation process encountered an error.
        // Return an error Query Result
        return {
          result: 'Error',
          message: 'Error Creating Classified "For Review" Transactions',
          detail: 'Unexpected Error',
        };
      }

      // Save the Classified 'For Review' transactions to the database.
      // Return the resulting Query Result created by the save function.
      return await addForReviewTransactions(
        classifiedForReviewTransactions,
        companyId
      );
    }
  } catch (error) {
    // Catch any errors and return an error Query Result, include the error message if it is present.
    if (error instanceof Error) {
      return {
        result: 'Error',
        message: 'An Unexpected Error Occured While Classifying.',
        detail: error.message,
      };
    } else {
      return {
        result: 'Error',
        message: 'An Unexpected Error Occured While Classifying.',
        detail: 'N/A',
      };
    }
  }
}

// Gets the 'For Review' transactions from the Company Accounts.
// Takes: The set of synthetic Login Tokens and the realm Id of the Company.
// Returns: An array of Sub-arrays for the 'For Review' transactions in the format: [FormattedForReviewTransaction, ForReviewTransaction]
export async function getForReviewTransactions(
  loginTokens: LoginTokens,
  companyId: string
): Promise<
  (FormattedForReviewTransaction | ForReviewTransaction)[][] | QueryResult
> {
  try {
    // Get all Accounts that may contain 'For Review' transactions.
    const response = await getAccounts('Transaction');
    const result = JSON.parse(response);

    // Check if the Transaction fetch resulted in an error.
    if (result[0].result === 'Error') {
      // If the Accounts fetch failed, log an error message and return an error Query Result.
      console.error(
        'Error Getting User Accounts To Fetch Review Transactions:' +
          result[0].message
      );
      return {
        result: 'Error',
        message: 'Error Getting User Accounts To Fetch Review Transactions',
        detail: result[0].message,
      };
    } else {
      // Remove the Query Result from the returned values and define results as an array of Account objects.
      const userAccounts: Account[] = result.slice(1);

      // Define an array to contain the fetched 'For Review' transactions.
      let foundTransactions: (
        | FormattedForReviewTransaction
        | ForReviewTransaction
      )[][] = [];

      // Iterate through the fetched Accounts that may contain 'For Review' transactions.
      for (const account of userAccounts) {
        // Get any 'For Review' transactions assosiated with the current Account.
        const forReviewResults = await getForReview(
          account.id,
          loginTokens,
          companyId
        );

        // Check if the 'For Review' transaction fetch resulted in error.
        if (forReviewResults.result === 'Error') {
          // For error Query Results, return the Query Result generated by the 'For Review' transaction fetching.
          return forReviewResults;
        } else {
          // If the fetch Query Result is a success, save the resulting 'For Review' transactions.
          // Parse the detail value of the Query Result into an array of Sub-arrays ([FormattedForReviewTransaction, ForReviewTransaction]).
          // Add the newly found 'For Review' transactions to the array of all fetched 'For Review' transactions.
          const resultTransactions: (
            | FormattedForReviewTransaction
            | ForReviewTransaction
          )[][] = JSON.parse(forReviewResults.detail);
          foundTransactions = foundTransactions.concat(resultTransactions);
        }
      }

      // Return the array of all fetched 'For Review' transactions.
      return foundTransactions;
    }
  } catch (error) {
    // Catch and log any errors, include the error message if it is present.
    // Also retrun an error Query Result object.
    if (error instanceof Error) {
      console.error('Error Getting "For Review" Transactions:' + error.message);
      return {
        result: 'Error',
        message: 'An Unexpected Error Occured While Getting Transactions',
        detail: error.message,
      };
    } else {
      console.error(
        'Error: Unexpected Error Getting "For Review" Transactions'
      );
      return {
        result: 'Error',
        message: 'An Unexpected Error Occured While Getting Transactions',
        detail: 'N/A',
      };
    }
  }
}

// Gets the saved and Classified Transactions from the Company for use in LLM prediction.
// Returns: An array of Transactions objects for the User Classified Transactions.
export async function getClassifiedPastTransactions(): Promise<Transaction[]> {
  try {
    // Define the range of dates to fetch Transactions from.
    const today = new Date();
    const fiveYearsAgo = new Date(
      today.getFullYear() - 5,
      today.getMonth(),
      today.getDate()
    );

    // Convert the date range to 'start date' and 'end date' strings in the format 'YYYY-MM-DD'.
    const startDate = today.toISOString().split('T')[0];
    const endDate = fiveYearsAgo.toISOString().split('T')[0];

    // Get the Classified and saved Transactions from QuickBooks.
    const response = await getSavedTransactions(startDate, endDate);
    const result = JSON.parse(response);

    // Check if the Transaction fetch resulted in an error.
    if (result[0].result === 'Error') {
      // If Transaction fetch failed, log an error and return an empty array.
      // Process will continue without saved Transactions to use as context.
      console.error('Error Loading Saved Transactions: ' + result[0].detail);
      return [];
    } else {
      // Remove the Query Result from the results and return the array of Transactions.
      return result.slice(1);
    }
  } catch (error) {
    // Catch and log any errors, include the error message if it is present.
    // Return an empty array to match expected return but indicate Transaction fetch failed.
    if (error instanceof Error) {
      console.error('Error Fetching Saved Transactions: ' + error.message);
      return [];
    } else {
      console.error('Error: Uncexpected Error Fetching Saved Transactions');
      return [];
    }
  }
}

// Gets the Company Info that is used in Transaction Classification.
// Returns: The relevant Company Info object.
export async function getCompanyInfo(): Promise<CompanyInfo> {
  try {
    // Get the Company Info values from the current Company.
    const userCompanyName = await getCompanyName();
    const userCompanyIndustry = await getCompanyIndustry();
    const userCompanyLocation = await getCompanyLocation();
    // Return the formatted Company Info object.
    return {
      name: userCompanyName,
      industry: userCompanyIndustry,
      location: JSON.parse(userCompanyLocation),
    };
  } catch (error) {
    // Catch and log any errors, include the error message if it is present.
    // Also return a Company Info object with the default error values.
    if (error instanceof Error) {
      console.error('Error Fetching Company Info: ' + error.message);
      return {
        name: 'Error: Name not found',
        industry: 'Error',
        location: { Country: '', SubLocation: null },
      };
    } else {
      console.error('Error: Uncexpected Error Fetching Company Info');
      return {
        name: 'Error: Name not found',
        industry: 'Error',
        location: { Country: '', SubLocation: null },
      };
    }
  }
}

// Takes: The array of Formatted and Raw 'For Review' transactions -
//        And a record of Transaction Id to the Classification arrays.
// Returns: The 'For Review' transaction array converted to Sub-arrays of [ClassifiedForReviewTransactions, ForReviewTransaction].
export async function createClassifiedForReviewTransactions(
  forReviewTransactions: (
    | FormattedForReviewTransaction
    | ForReviewTransaction
  )[][],
  result: Record<
    string,
    {
      category: ClassifiedElement[] | null;
      taxCode: ClassifiedElement[] | null;
    }
  >
): Promise<(ClassifiedForReviewTransaction | ForReviewTransaction)[][]> {
  try {
    // Create an array for Classified 'For Review' transactions.
    const newCategorizedTransactions: (
      | ClassifiedForReviewTransaction
      | ForReviewTransaction
    )[][] = [];

    // Iterate through the passed 'For Review' transactions.
    for (const transaction of forReviewTransactions) {
      // Create a record to track the Classifications of a 'For Review' transaction by its Id.
      const nonNullResult = result as Record<
        string,
        {
          category: ClassifiedElement[] | null;
          taxCode: ClassifiedElement[] | null;
        }
      >;

      // Extract the 'For Review' transactions from the Sub-array and define their types.
      const formattedTransaction =
        transaction[0] as FormattedForReviewTransaction;
      const fullTransaction = transaction[1] as ForReviewTransaction;

      // Define inital null values for the Classifications and their confidence values.
      let categoryClassification = null;
      let categoryConfidence = 0;
      let taxCodeClassification = null;
      let taxCodeCondifence = 0;

      // Extract the value for the current 'For Review' transaction from the passed 'For Review' transaction record.
      const transactionClassifications =
        nonNullResult[formattedTransaction.transaction_Id];

      // Check if the Classification result values for the current 'For Review' transaction are present.
      if (transactionClassifications) {
        // Use the extracted values to update the Classifications.
        categoryClassification = transactionClassifications.category;
        taxCodeClassification = transactionClassifications.taxCode;
        // Check if the Classifications are not null and one or more Classifications are present.
        if (
          transactionClassifications.category &&
          transactionClassifications.category.length > 0
        ) {
          // Update the related confidence value.
          categoryConfidence = checkConfidenceValue(
            transactionClassifications.category[0].classifiedBy
          );
        }

        if (
          transactionClassifications.taxCode &&
          transactionClassifications.taxCode.length > 0
        ) {
          // Update the related confidence value.
          taxCodeCondifence = checkConfidenceValue(
            transactionClassifications.taxCode[0].classifiedBy
          );
        }
      }

      // Push the new ClassifiedForReviewTransaction and its related ForReviewTransaction as a Sub-array.
      // Adds them to the array of new Categorized 'For Review' transactions.
      newCategorizedTransactions.push([
        // Define a Classified 'For Review' transaction to be added.
        {
          transaction_Id: formattedTransaction.transaction_Id,
          name: formattedTransaction.name,
          date: formattedTransaction.date,
          account: formattedTransaction.account,
          accountName: formattedTransaction.accountName,
          amount: formattedTransaction.amount,
          // Adds either the inital null values or the Classifications found in the results.
          categories: categoryClassification,
          categoryConfidence: categoryConfidence,
          taxCodes: taxCodeClassification,
          taxCodeConfidence: taxCodeCondifence,
        },
        fullTransaction,
      ]);
    }
    // Return the array of Classified 'For Review' transactions (and their related Raw 'For Review' transaction).
    return newCategorizedTransactions;
  } catch (error) {
    // Catch and log any errors, include the error message if it is present.
    // Return an empty array to match expected return but indicate Classification failed.
    if (error instanceof Error) {
      console.error('Error Creating Classified Transactions: ' + error.message);
      return [];
    } else {
      console.error('Error: Unexpected Error Creating Classified Transactions');
      return [];
    }
  }
}
