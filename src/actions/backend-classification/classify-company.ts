'use server';
import { setNextReviewTimestamp } from './next-review-timestamp';
import { classifyTransactions } from '../classify';
import { getAccounts } from '../quickbooks/get-accounts';
import { getForReview } from '../quickbooks/get-for-review';
import { getPastTransactions } from '../quickbooks/get-transactions';
import {
  getCompanyIndustry,
  getCompanyLocation,
  getCompanyName,
} from '../quickbooks/user-info';
import { addForReviewTransactions } from '../db-review-transactions/add-db-for-review';
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
  session: Session
): Promise<QueryResult> {
  // Define the realmId (company ID) from the passed session.
  // Assert it is not null as null sessions would not be passed.
  const companyId = session.realmId!;

  // Get the for review transactions for all the companies accounts.
  const forReviewResult = await getForReviewTransactions(
    session,
    companyId,
    fetchToken,
    authId
  );

  // Check if the for review transaction call encountered an error.
  if ('result' in forReviewResult) {
    // If an error is encountered, return the query response.
    return forReviewResult;
  }

  // If an error was not encountered, define the fetched for review transactions.
  const forReviewTransactions = forReviewResult as (
    | ForReviewTransaction
    | FormattedForReviewTransaction
  )[][];

  // Get the users previously classified transactions to use as context for prediction.
  const classifiedPastTransactions = await getClassifiedPastTransactions();

  // Define just the formatted transactions to use in classification.
  const formattedForReviewTransactions = forReviewTransactions.map(
    (subArray) => subArray[0] as FormattedForReviewTransaction
  );

  // Get company info to be used in assisting with classification.
  const companyInfo = await getCompanyInfo();

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
    companyInfo
  );

  // If there was an error classifing the transactions, return it as a object.
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
    // If there was no error classifing the transactions, use the results to create classified 'for review' transactions.
    const classifiedForReviewTransactions =
      createClassifiedForReviewTransactions(
        forReviewTransactions,
        validClassificationResults
      );

    // Update the timer for the next automatic review.
    setNextReviewTimestamp();

    // Save the classified transactions to the database.
    // Return a Query Result created by the database adding method.
    return await addForReviewTransactions(
      classifiedForReviewTransactions,
      companyId
    );
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
  // Get all accounts that may contain transactions
  const foundAccounts = await getAccounts('transaction', session);
  const userAccounts: Account[] = JSON.parse(foundAccounts);

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
    // If the fetch was successful, append the resulting array to array of found transactions.
    if (result.result === 'Success') {
      // Parse and define the result details and concatenate them onto the current array of transactions.
      const resultTransactions: (
        | ForReviewTransaction
        | FormattedForReviewTransaction
      )[][] = JSON.parse(result.detail);
      foundTransactions = foundTransactions.concat(resultTransactions);
    } else {
      return result;
    }
  }

  // Return the found 'for review' transactions.
  return foundTransactions;
}

async function getClassifiedPastTransactions(): Promise<Transaction[]> {
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

  // Get the past transactions from QuickBooks for checking matches.
  const response = await getPastTransactions(startDate, endDate);
  const pastTransactions = JSON.parse(response);
  // Return transactions with result value removed.
  // On failure, result is still a valid empty array.
  return pastTransactions.slice(1);
}

async function getCompanyInfo(): Promise<CompanyInfo> {
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
}

export async function manualReview(
  setManualReviewState: (newState: string) => void
) {
  // Preform the manual review for the current user company.
  // Update the manual review to indicate the process has started.
  setManualReviewState('Loading Transactions ...')
}
