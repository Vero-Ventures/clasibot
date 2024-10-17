'use server';
import { getForReview } from '@/actions/backend-functions/get-for-review';

import { getAccounts } from '@/actions/quickbooks/get-accounts';
import { getSavedTransactions } from '@/actions/quickbooks/get-saved-transactions';
import {
  getCompanyIndustry,
  getCompanyLocation,
  getCompanyName,
} from '@/actions/quickbooks/user-info';
import { addForReviewTransactions } from '@/actions/backend-functions/database-functions/add-db-for-review';
import { setNextReviewTimestamp } from '@/actions/backend-functions/database-functions/next-review-timestamp';
import { classifyTransactions } from './classify';
import type { Session } from 'next-auth/core/types';
import type { Account } from '@/types/Account';
import type { ClassifiedElement } from '@/types/Classification';
import type { CompanyInfo } from '@/types/CompanyInfo';
import type {
  ForReviewTransaction,
  FormattedForReviewTransaction,
  ClassifiedForReviewTransaction,
} from '@/types/ForReviewTransaction';
import type { QueryResult } from '@/types/QueryResult';
import type { Transaction } from '@/types/Transaction';

// Takes fetch token and auth ID gotten from QBO during synthetic login as well as the generated session.
// Manual Review Specific:
//        Truth value indicating it is a manual review and a state update function for frontend updating.
// Returns: the query result from transaction-saving or an error query result.
// Integration: Called by weekly classification method.
export async function classifyCompany(
  fetchToken: string,
  authId: string,
  session: Session,
  manualClassify: boolean,
  setFrontendState: ((newState: string) => void) | null = null
): Promise<QueryResult> {
  try {
    // Manual Review: Update frontend state for 'For Review' transaction fetching with non-null assertion.
    if (manualClassify) setFrontendState!('Loading New Transactions ... ');

    // Get the 'For Review' transactions for all accounts related to the current company.
    const forReviewResult = await getForReviewTransactions(
      session,
      fetchToken,
      authId
    );

    // Check if the 'For Review' transaction call encountered an error (returned value is a query result on failure).
    if ('result' in forReviewResult) {
      // Return the query response to the caller as the error handling.
      return forReviewResult;
    }

    // Define the fetched 'For Review' transactions as an array of ararys.
    // Interal array format is [FormattedForReviewTransaction, ForReviewTransaction] for each 'For Review' transaction.
    const forReviewTransactions = forReviewResult as (
      | ForReviewTransaction
      | FormattedForReviewTransaction
    )[][];

    // Manual Review: Update frontend state for fetching classified transactions with non-null assertion.
    if (manualClassify) setFrontendState!('Getting Transaction History ... ');

    // Get the saved classified transactions from the user to use as context for prediction.
    const classifiedPastTransactions =
      await getClassifiedPastTransactions(session);

    // Extract the formatted 'For Review' transactions to use in classification.
    const formattedForReviewTransactions = forReviewTransactions.map(
      (subArray) => subArray[0] as FormattedForReviewTransaction
    );

    // Get company info for the user, used in assisting with classification by LLM.
    // Returned values may be error / null but that is accounted for by use in LLM.
    const companyInfo = await getCompanyInfo(session);

    // Manual Review: Update frontend state to indicate start of classification with non-null assertion.
    if (manualClassify) setFrontendState!('Classifying New Transactions ... ');

    // Call classification on the formatted 'For Review' transactions.
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
      session
    );

    // Checl for error created by classification.
    if (classificationResults.error) {
      // Convert the returned error object to a string then return it as the detail of an 'Error' Query Result.
      const resultDetail = classificationResults.error as string;
      return {
        result: 'Error',
        message: 'Error classifying the "For Review" transactions',
        detail: resultDetail,
      };
    } else {
      // Define the classification results format as non-error typing is checked.
      const validClassificationResults = classificationResults as Record<
        string,
        {
          category: ClassifiedElement[] | null;
          taxCode: ClassifiedElement[] | null;
        }
      >;

      // Manual Review: Update frontend state to indicate classified 'For Review' transaction creation with non-null assertion.
      if (manualClassify) setFrontendState!('Evaluating Classifications ... ');

      // Use transaction classification results to create classified 'For Review' transaction objects.
      const classifiedForReviewTransactions =
        createClassifiedForReviewTransactions(
          forReviewTransactions,
          validClassificationResults
        );

      // If not doing manual classification, update the database timestamp for the next automatic review.
      if (!manualClassify) {
        setNextReviewTimestamp();
      }

      // Manual Review: Update frontend state for database saving of classified 'For Review' transactions with non-null assertion.
      if (manualClassify) setFrontendState!('Saving Classifications ... ');

      // Save the classified 'For Review' transactions to the database.
      // Return the resulting Query Result created by the database saving function.
      return await addForReviewTransactions(
        classifiedForReviewTransactions,
        session.realmId!
      );
    }
    // Catch any errors and check for an error message.
  } catch (error) {
    // Return an appropriate message indicating an unexpected error.
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

// Takes the fetch and authId tokens gotten during synthetic login, as well as the created session.
// Returns: an array of sub-arrays in the format: [FormattedForReviewTransaction, ForReviewTransaction]
async function getForReviewTransactions(
  session: Session,
  fetchToken: string,
  authId: string
): Promise<
  (FormattedForReviewTransaction | ForReviewTransaction)[][] | QueryResult
> {
  try {
    // Get all accounts that may contain 'For Review' transactions.
    const response = await getAccounts('Transaction', session);
    const result = JSON.parse(response);

    // Check the result of the account fetching, the first index always contains a Query Result.
    if (result[0].result === 'Error') {
      // If the fetching failed, return an empty array.
      // Process will continue without 'For Review' transactions from the current account.
      return [];
    } else {
      // Remove the Query Result and define the remaining values as an array of Account objects.
      const userAccounts: Account[] = result.slice(1);

      // Define an array for the found 'For Review' transactions.
      let foundTransactions: (
        | FormattedForReviewTransaction
        | ForReviewTransaction
      )[][] = [];

      // Iterate through the fetched accounts that may contain 'For Review' transactions.
      for (const account of userAccounts) {
        // Get any 'For Review' transactions from the current account.
        const result = await getForReview(
          account.id,
          session.realmId!,
          fetchToken,
          authId
        );

        // If the fetch was successful, append the resulting detail content to array of found 'For Review' transactions.
        if (result.result === 'Success') {
          // Parse the result details into an array of arrays in the format [FormattedForReviewTransaction, ForReviewTransaction]
          // Then add the results the the existing array of 'For Review' transactions.
          const resultTransactions: (
            | FormattedForReviewTransaction
            | ForReviewTransaction
          )[][] = JSON.parse(result.detail);
          foundTransactions = foundTransactions.concat(resultTransactions);
        } else {
          // Return the failure Query Result generated by the 'For Review' transaction fetching.
          return result;
        }
      }

      // Return the found array of 'For Review' transactions.
      return foundTransactions;
    }
    // Catch any errors and check for an error message.
  } catch (error) {
    // Return an appropriate message indicating an unexpected error fetching 'For Review' transactions.
    if (error instanceof Error) {
      return {
        result: 'Error',
        message: 'An Unexpected Error Occured While Getting Transactions',
        detail: error.message,
      };
    } else {
      return {
        result: 'Error',
        message: 'An Unexpected Error Occured While Getting Transactions',
        detail: 'N/A',
      };
    }
  }
}

// Takes a session generated during synthetic login.
// Returns: an array of transactions objects for the users classified transactions.
async function getClassifiedPastTransactions(
  session: Session
): Promise<Transaction[]> {
  try {
    // Get a reference for the current date and the date 5 years ago.
    // This is used as the range of dates to fetch saved transactions to be used as classification context.
    const today = new Date();
    const fiveYearsAgo = new Date(
      today.getFullYear() - 5,
      today.getMonth(),
      today.getDate()
    );

    // Convert the dates to a start date and end date strings in the format 'YYYY-MM-DD'.
    const startDate = today.toISOString().split('T')[0];
    const endDate = fiveYearsAgo.toISOString().split('T')[0];

    // Get the users saved transactions from QuickBooks for checking matches and parse the result.
    const response = await getSavedTransactions(startDate, endDate, session);
    const result = JSON.parse(response);

    // Check the first index which is always a Query Result.
    if (result[0].result === 'Error') {
      // On failure to fetch transactions, return an empty array.
      // Process will continue without prior transactions to use as context.
      return [];
    } else {
      // Return the resulting transactions with the inital query result value removed.
      return result.slice(1);
    }
    // Catch any errors and check for an error message.
  } catch (error) {
    // Return an appropriate message indicating an unexpected error fetching saved transactions.
    if (error instanceof Error) {
      console.error('Error: ' + error.message);
      return [];
    } else {
      console.error('Error: Uncexpected Error Fetching Saved Transactions');
      return [];
    }
  }
}

// Gets the company info for the current user using the synthetic login sesssion.
// Returns: the company info as an object
async function getCompanyInfo(session: Session): Promise<CompanyInfo> {
  try {
    // Get the key company info values from the user-info calls.
    const userCompanyName = await getCompanyName(session);
    const userCompanyIndustry = await getCompanyIndustry(session);
    const userCompanyLocation = await getCompanyLocation(session);
    // Return the formatted company info values.
    return {
      name: userCompanyName,
      industry: userCompanyIndustry,
      location: JSON.parse(userCompanyLocation),
    };
    // Catch any errors and check for an error message.
  } catch (error) {
    // Log an error message and return a company info of error values.
    if (error instanceof Error) {
      console.error('Error: ' + error.message);
      return {
        name: 'Error: Name not found',
        industry: 'Error',
        location: { Country: '', Location: null },
      };
    } else {
      console.error('Error: Uncexpected Error');
      return {
        name: 'Error: Name not found',
        industry: 'Error',
        location: { Country: '', Location: null },
      };
    }
  }
}

// Takes the array of formatted and raw 'For Review' transactions.
// Also takes a record that connects a transaction ID to an array of each of its classifications.
// Returns: The 'For Review' transaction array converted to ClassifiedForReviewTransactions and Raw 'For Review' transactions.
function createClassifiedForReviewTransactions(
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
): (ClassifiedForReviewTransaction | ForReviewTransaction)[][] {
  try {
    // Create an array for the newly classified 'For Review' transactions.
    const newCategorizedTransactions: (
      | ClassifiedForReviewTransaction
      | ForReviewTransaction
    )[][] = [];

    // Iterate passed 'For Review' transactions.
    for (const transaction of forReviewTransactions) {
      // Create a record to track the classifications and be combined with the 'For Review' transaction later.
      const nonNullResult = result as Record<
        string,
        {
          category: ClassifiedElement[] | null;
          taxCode: ClassifiedElement[] | null;
        }
      >;

      // Extract the 'For Review' transactions from the sub array and define their types.
      const formattedTransaction =
        transaction[0] as FormattedForReviewTransaction;
      const fullTransaction = transaction[1] as ForReviewTransaction;

      // Define inital null values for thecategory and tax code predictions.
      let categoryClassification = null;
      let taxCodeClassification = null;

      // Extract the value from the results record assosiated with the current 'For Review' transaction.
      const transactionClassifications =
        nonNullResult[formattedTransaction.transaction_ID];

      // Check if the results values for the current 'For Review' transaction are present.
      if (transactionClassifications) {
        // Use the extracted results values to update the classifications.
        categoryClassification = transactionClassifications.category;
        taxCodeClassification = transactionClassifications.taxCode;
      }

      // Push the resulting ClassifiedForReviewTransaction and ForReviewTransaction in a sub-array to the new  categorized 'For Review' transactions array.
      newCategorizedTransactions.push([
        // Define a classified 'For Review' transaction to be added.
        {
          transaction_ID: formattedTransaction.transaction_ID,
          name: formattedTransaction.name,
          date: formattedTransaction.date,
          account: formattedTransaction.account,
          accountName: formattedTransaction.accountName,
          amount: formattedTransaction.amount,
          // Adds either the inital null values or the classifications if a match was found in results.
          categories: categoryClassification,
          taxCodes: taxCodeClassification,
        },
        fullTransaction,
      ]);
    }
    // Return the array of classified 'For Review' transactions (and their related raw transaction).
    return newCategorizedTransactions;
    // Catch any errors and check for an error message.
  } catch (error) {
    // Log an error message and return a company info of error values.
    if (error instanceof Error) {
      console.error('Error: ' + error.message);
      return [];
    } else {
      console.error(
        'Error: Unexpected Error Creatiing Classified Transactions'
      );
      return [];
    }
  }
}
