'use server';
import { setNextReviewTimestamp } from '@/actions/backend-functions/database-functions/next-review-timestamp';
import { getAccounts } from '@/actions/quickbooks/get-accounts';
import { getForReview } from '@/actions/backend-functions/get-for-review';
import { getPastTransactions } from '@/actions/quickbooks/get-transactions';
import {
  getCompanyIndustry,
  getCompanyLocation,
  getCompanyName,
} from '@/actions/quickbooks/user-info';
import { classifyTransactions } from './classify';
import { addForReviewTransactions } from '../database-functions/add-db-for-review';
import type { Session } from 'next-auth/core/types';
import type { Account } from '@/types/Account';
import type { ClassifiedElement } from '@/types/Classification';
import type { CompanyInfo } from '@/types/CompanyInfo';
import type { QueryResult } from '@/types/QueryResult';
import type {
  ForReviewTransaction,
  FormattedForReviewTransaction,
  ClassifiedForReviewTransaction,
} from '@/types/ForReviewTransaction';
import type { Transaction } from '@/types/Transaction';

export async function classifyCompany(
  fetchToken: string,
  authId: string,
  session: Session,
  manualClassify: boolean,
  setManualReviewState: ((newState: string) => void) | null = null
): Promise<QueryResult> {
  try {
    // Define the realmId (company ID) from the passed session.
    // Assert it is not null as null sessions would not be passed.
    const companyId = session.realmId!;

    // If in manual review: Update manual review state for transaction fetch with non-null assertion.
    if (manualClassify) setManualReviewState!('Loading New Transactions ... ');

    // Get the for review transactions for all the companies accounts.
    const forReviewResult = await getForReviewTransactions(
      session,
      companyId,
      fetchToken,
      authId
    );

    // Check if the for review transaction call encountered an error.
    // Done by checking if the returned value is a query result only returned on failure.
    if ('result' in forReviewResult) {
      // If an error is encountered, return the query response.
      return forReviewResult;
    }

    // If an error was not encountered, define the fetched for review transactions.
    const forReviewTransactions = forReviewResult as (
      | ForReviewTransaction
      | FormattedForReviewTransaction
    )[][];

    // If in manual review: Update manual review state for fetching classified transactions with non-null assertion.
    if (manualClassify)
      setManualReviewState!('Getting Transaction History ... ');

    // Get the users previously classified transactions to use as context for prediction.
    const classifiedPastTransactions =
      await getClassifiedPastTransactions(session);

    // Define just the formatted transactions to use in classification.
    const formattedForReviewTransactions = forReviewTransactions.map(
      (subArray) => subArray[0] as FormattedForReviewTransaction
    );

    // Get company info to be used in assisting with classification.
    const companyInfo = await getCompanyInfo();

    // If in manual review: Update manual review state for start of classification with non-null assertion.
    if (manualClassify)
      setManualReviewState!('classifying New Transactions ... ');

    // Classify the transactions that are not uncategorized.
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
      companyId,
      companyInfo,
      session
    );

    // If there was an error classifying the transactions, return it as a object.
    if (classificationResults.error) {
      const resultDetail = classificationResults.error as string;
      return {
        result: 'Error',
        message: 'Error classifying the "For Review" transactions',
        detail: resultDetail,
      };
    } else {
      // Define an version of the classification results without the possible error value.
      const validClassificationResults = classificationResults as Record<
        string,
        {
          category: ClassifiedElement[] | null;
          taxCode: ClassifiedElement[] | null;
        }
      >;

      // If in manual review: Update manual review state for 'for review' transaction creation with non-null assertion.
      if (manualClassify)
        setManualReviewState!('Evaluating Classifications ... ');

      // If there was no error classifying the transactions, use the results to create classified 'for review' transactions.
      const classifiedForReviewTransactions =
        createClassifiedForReviewTransactions(
          forReviewTransactions,
          validClassificationResults
        );

      // Only update the time stamp if not
      if (!manualClassify) {
        // Update the timer for the next automatic review.
        setNextReviewTimestamp();
      }

      // If in manual review: Update manual review state for creation of 'for review' database transactions with non-null assertion.
      if (manualClassify) setManualReviewState!('Saving Classifications ... ');

      // Save the classified transactions to the database.
      // Return a Query Result created by the database adding method.
      return await addForReviewTransactions(
        classifiedForReviewTransactions,
        companyId
      );
    }
  } catch (error) {
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

async function getForReviewTransactions(
  session: Session,
  companyId: string,
  fetchToken: string,
  authId: string
): Promise<
  (ForReviewTransaction | FormattedForReviewTransaction)[][] | QueryResult
> {
  try {
    // Get all accounts that may contain transactions
    const response = await getAccounts('Transaction', session);
    const result = JSON.parse(response);

    // Check the result of the account fetching by checking the first index.
    if (result[0].result === 'Error') {
      // If the fetching failed, return an array of 0 transactions.
      return [];
    } else {
      // If the fetch did not fail, remove the first value and continue.
      const userAccounts: Account[] = result.slice(1);

      // Define array to hold found 'for review' transactions.
      let foundTransactions: (
        | ForReviewTransaction
        | FormattedForReviewTransaction
      )[][] = [];

      // Iterate through the user accounts.
      for (const account of userAccounts) {
        // Get any 'for review' transactions for the current account.
        const result = await getForReview(
          account.id,
          companyId,
          fetchToken,
          authId
        );

        // If the fetch was successful, append the resulting detail content to array of found transactions.
        if (result.result === 'Success') {
          // Parse and define the result details and concatenate them onto the current array of transactions.
          const resultTransactions: (
            | ForReviewTransaction
            | FormattedForReviewTransaction
          )[][] = JSON.parse(result.detail);
          foundTransactions = foundTransactions.concat(resultTransactions);
        } else {
          // Return the failure result.
          return result;
        }
      }

      // Return the found 'for review' transactions.
      return foundTransactions;
    }
  } catch (error) {
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

async function getClassifiedPastTransactions(
  session: Session
): Promise<Transaction[]> {
  try {
    // Get a reference for the current date and the date 5 years ago.
    const today = new Date();
    const setBackRange = 5;
    const fiveYearsAgo = new Date(
      today.getFullYear() - setBackRange,
      today.getMonth(),
      today.getDate()
    );

    // Convert the dates to start date and end date strings in the format 'YYYY-MM-DD'.
    const startDate = today.toISOString().split('T')[0];
    const endDate = fiveYearsAgo.toISOString().split('T')[0];

    // Get the past transactions from QuickBooks for checking matches and parse the result.
    const response = await getPastTransactions(startDate, endDate, session);
    const result = JSON.parse(response);

    // On failure, return an empty array to continue the process.
    if (result[0].result === 'Error') {
      return [];
    } else {
      // On success return the results with the inital query result value removed.
      return result.slice(1);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error: ' + error.message);
      return [];
    } else {
      console.error('Error: Uncexpected Error');
      return [];
    }
  }
}

async function getCompanyInfo(): Promise<CompanyInfo> {
  try {
    // Get the key company info values from the user-info calls.
    const userCompanyName = await getCompanyName();
    const userCompanyIndustry = await getCompanyIndustry();
    const userCompanyLocation = await getCompanyLocation();
    // Return the formatted company info values.
    return {
      name: userCompanyName,
      industry: userCompanyIndustry,
      location: JSON.parse(userCompanyLocation),
    };
  } catch (error) {
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
): (ForReviewTransaction | ClassifiedForReviewTransaction)[][] {
  try {
    // Create an array for the newly classified 'for review' transactions.
    const newCategorizedTransactions: (
      | ClassifiedForReviewTransaction
      | ForReviewTransaction
    )[][] = [];

    // Iterate through the selected rows and add the categorized transactions to the array.
    for (const transaction of forReviewTransactions) {
      // Define a value for the result asserting it is not null (confirmed by above check.)
      const nonNullResult = result as Record<
        string,
        {
          category: ClassifiedElement[] | null;
          taxCode: ClassifiedElement[] | null;
        }
      >;
      // Define the formatted value of the array.
      const formattedTransaction =
        transaction[0] as FormattedForReviewTransaction;
      const fullTransaction = transaction[1] as ForReviewTransaction;

      // Define values for the category and tax code predictions as nulls to be overwritten if present in results.
      let categoryClassification = null;
      let taxCodeClassification = null;

      // Check the results to see if the predictions are valid.
      const transactionClassifications =
        nonNullResult[formattedTransaction.transaction_ID];

      // If the results for the transaction are present, update the classification values.
      if (transactionClassifications) {
        categoryClassification = transactionClassifications.category;
        taxCodeClassification = transactionClassifications.taxCode;
      }

      // Define the formatted transaction from the dual "For Review" transaction array.
      newCategorizedTransactions.push([
        {
          transaction_ID: formattedTransaction.transaction_ID,
          name: formattedTransaction.name,
          date: formattedTransaction.date,
          account: formattedTransaction.account,
          accountName: formattedTransaction.accountName,
          amount: formattedTransaction.amount,
          // Get the categories from the result object using its ID. Gets an empty array if no match is found.
          categories: categoryClassification,
          taxCodes: taxCodeClassification,
        },
        fullTransaction,
      ]);
    }
    return newCategorizedTransactions;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error: ' + error.message);
      return [];
    } else {
      console.error('Error: Uncexpected Error');
      return [];
    }
  }
}
