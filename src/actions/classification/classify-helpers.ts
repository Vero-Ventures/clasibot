'use server';

import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

import { db } from '@/db/index';
import { eq } from 'drizzle-orm';
import { Company } from '@/db/schema';

import { syntheticLogin } from '@/actions/synthetic-login';

import { classifyTransactions } from './index';

import {
  getForReviewTransactions,
  getClassifiedPastTransactions,
  getCompanyInfo,
  createClassifiedForReviewTransactions,
} from './classify-company';

import type {
  ClassifiedElement,
  ClassifiedForReviewTransaction,
  CompanyInfo,
  RawForReviewTransaction,
  FormattedForReviewTransaction,
  LoginTokens,
  Transaction,
} from '@/types/index';

// Starts the Classificaion process by getting session and Company info used in synthetic login.
// Returns: Boolean value for success / failure, the Company realm Id and the potential Firm name.
export async function startClassification(): Promise<{
  result: boolean;
  realmId: string;
  firmName: string | null;
}> {
  try {
    // Get the current session for the Company realm Id of the currently logged in Company.
    const session = await getServerSession(options);

    // If session or Company realm Id are not found, handle error logging, state update, and return a failure value.
    if (!session?.realmId) {
      console.error('Backend Classification: Session Not Found.');
      return {
        result: false,
        realmId: '',
        firmName: null,
      };
    }

    // Get the current Company from the database to check for a Firm name.
    const currentCompany = await db
      .select()
      .from(Company)
      .where(eq(Company.realmId, session.realmId));

    // Check that a matching database Company object was found.
    // Return result object and preform error logging if needed.
    if (!currentCompany[0]) {
      console.error('Backend Classification: Company Not Found In Database.');
      return {
        result: false,
        realmId: '',
        firmName: null,
      };
    } else {
      return {
        result: true,
        realmId: session.realmId,
        firmName: currentCompany[0].firmName,
      };
    }
  } catch (error) {
    // Catch any errors and log an error, include the error message if it is present.
    if (error instanceof Error) {
      console.log('Error During Classification : ' + error.message);
    } else {
      console.log('Unexpected Error During Classification');
    }
    // Return failure result and values to the caller.
    return { result: false, realmId: '', firmName: null };
  }
}

// Preforms the synthetic login process to get the Login Tokens needed by the backend Classificaion functions.
// Takes: The Company realm Id and the possible Firm name the Company belongs to.
// Returns: Boolean value for success / failure, the Login Tokens generated by the synthetic login process.
export async function preformSyntheticLogin(
  realmId: string,
  firmName: string | null
): Promise<{ result: boolean; loginTokens: LoginTokens | null }> {
  try {
    // Call synthetic login method with the Company realm Id and (possibly null) Firm name for the Company.
    // Returns: A QueryResult and a synthetic Login Tokens object.
    const [loginResult, loginTokens] = await syntheticLogin(realmId, firmName);

    // Check the synthetic login call resulted in error.
    if (loginResult.result === 'Error ') {
      // If the synthetic login resulted in error, Log the Query Result, update frontend state, and return a failure boolean.
      console.error(loginResult);
      return { result: false, loginTokens: null };
    } else {
      return { result: true, loginTokens: loginTokens };
    }
  } catch (error) {
    // Catch any errors and log an error, include the error message if it is present.
    if (error instanceof Error) {
      console.log('Error During Classification : ' + error.message);
    } else {
      console.log('Unexpected Error During Classification');
    }
    // Return failure result and values to the caller.
    return { result: false, loginTokens: null };
  }
}

// Gets the 'For Review' transactions to be Classified from the backend processes.
// Takes: The Login Tokens from synthetic login and the Company realm Id.
// Returns: Boolean value for success / failure, the Formatted and Raw 'For Review' transactions.
export async function fetchTransactionsToClassify(
  loginTokens: LoginTokens,
  realmId: string
): Promise<{
  result: boolean;
  transactions: (FormattedForReviewTransaction | RawForReviewTransaction)[][];
}> {
  try {
    // Get the 'For Review' transactions for all Accounts related to the current Company.
    const forReviewResult = await getForReviewTransactions(
      loginTokens,
      realmId
    );

    // Check if the 'For Review' transaction call encountered an error.
    // Result is only present in Query Result typing (only returned on error).
    if ('result' in forReviewResult) {
      // Return a failure boolean and an empty array for the 'For Review' transactions.
      return {
        result: false,
        transactions: [],
      };
    }

    // Define the fetched 'For Review' transactions as an array of Sub-arrays.
    // Interal array format is [FormattedForReviewTransaction, ForReviewTransaction] for each 'For Review' transaction.
    const forReviewTransactions = forReviewResult as (
      | FormattedForReviewTransaction
      | RawForReviewTransaction
    )[][];

    // Return the defined array of 'For Review' transactions.
    return {
      result: true,
      transactions: forReviewTransactions,
    };
  } catch (error) {
    // Catch any errors and log an error, include the error message if it is present.
    if (error instanceof Error) {
      console.log('Error During Classification : ' + error.message);
    } else {
      console.log('Unexpected Error During Classification');
    }
    // Return failure result and values to the caller.
    return { result: false, transactions: [] };
  }
}

// Gets the users past Transactions to be used as context during Classificaion.
// Returns: Boolean value for success / failure, the Transactions, and the Comapany Info.
export async function fetchPredictionContext(): Promise<{
  result: boolean;
  transactions: Transaction[];
  companyInfo: CompanyInfo | null;
}> {
  try {
    // Get the saved Classified Transactions from the User to use as context for prediction.
    const classifiedPastTransactions = await getClassifiedPastTransactions();

    // Get Company Info for the User as context during LLM predictions.
    const companyInfo = await getCompanyInfo();

    // Return the fetched context (Transactions and Company Info).
    return {
      result: true,
      transactions: classifiedPastTransactions,
      companyInfo: companyInfo,
    };
  } catch (error) {
    // Catch any errors and log an error, include the error message if it is present.
    if (error instanceof Error) {
      console.log('Error During Classification : ' + error.message);
    } else {
      console.log('Unexpected Error During Classification');
    }
    // Return failure result and values to the caller.
    return { result: false, transactions: [], companyInfo: null };
  }
}

// Begins the Classificaion process on the 'For Review' transactions.
// Takes: The context Transactions, the 'For Review' transactions to be Classified,
//        The context Company Info, the Login Tokens from synthetic login, and the Company realm Id.
// Returns: Boolean value for success / failure, the record of Transaction Id to Classificaions.
export async function startTransactionClassification(
  contextTransactions: Transaction[],
  reviewTransactions: FormattedForReviewTransaction[],
  companyInfo: CompanyInfo,
  loginTokens: LoginTokens,
  realmId: string
): Promise<{
  result: boolean;
  classificationResults: Record<
    string,
    {
      category: ClassifiedElement[] | null;
      taxCode: ClassifiedElement[] | null;
    }
  >;
}> {
  try {
    // Call Classification function on the formatted 'For Review' transactions.
    const classificationResults = await classifyTransactions(
      contextTransactions,
      reviewTransactions,
      companyInfo,
      realmId
    );

    // Check for error object returned by the Classification call.
    if (classificationResults.error) {
      // Return failure result and empty Classificaion result to the caller.
      return {
        result: false,
        classificationResults: {},
      };
    } else {
      // Define the type of the Classificaion results record then return it.
      const resultsRecord = classificationResults as Record<
        string,
        {
          category: ClassifiedElement[] | null;
          taxCode: ClassifiedElement[] | null;
        }
      >;
      return {
        result: true,
        classificationResults: resultsRecord,
      };
    }
  } catch (error) {
    // Catch any errors and log an error, include the error message if it is present.
    if (error instanceof Error) {
      console.log('Error During Classification : ' + error.message);
    } else {
      console.log('Unexpected Error During Classification');
    }
    // Return failure result and values to the caller.
    return { result: false, classificationResults: {} };
  }
}

// Takes the base 'For Review' transactions and their Classificaions and creates the Classified 'For Review' transactions.
// Takes: The array of Formatted and Raw 'For Review' transactions and the record of Classificaions.
// Returns: Boolean value for success / failure, an array of Classified and Raw 'For Review' transactions.
export async function createClassifiedTransactions(
  forReviewTransactions: (
    | FormattedForReviewTransaction
    | RawForReviewTransaction
  )[][],
  validClassificationResults: Record<
    string,
    {
      category: ClassifiedElement[] | null;
      taxCode: ClassifiedElement[] | null;
    }
  >
): Promise<{
  result: boolean;
  transactions: (ClassifiedForReviewTransaction | RawForReviewTransaction)[][];
}> {
  try {
    // Use Classification results to create Classified 'For Review' transaction objects.
    const classifiedForReviewTransactions =
      await createClassifiedForReviewTransactions(
        forReviewTransactions,
        validClassificationResults
      );

    // Check if the number of Classified 'For Review' transactions is less than the number of passed 'For Review' transactions.
    if (classifiedForReviewTransactions.length < forReviewTransactions.length) {
      // Fewer returned values means the Classified 'For Review' transaction creation process encountered an error.
      // Return an error result value and an empty array for the 'For Review' transactions.
      return {
        result: false,
        transactions: [],
      };
    } else {
      // If no error was encountered, return a success value and the Classified 'For Review' transactions.
      return {
        result: true,
        transactions: classifiedForReviewTransactions,
      };
    }
  } catch (error) {
    // Catch any errors and log an error, include the error message if it is present.
    if (error instanceof Error) {
      console.log('Error During Classification : ' + error.message);
    } else {
      console.log('Unexpected Error During Classification');
    }
    // Return failure result and values to the caller.
    return { result: false, transactions: [] };
  }
}

// Determines three key values for tracking the progress of the Classification for the user.
// Sets the values based on a passed state string to indicate the current process.
// Takes: One of the defined state strings to be checked.
// Returns: The frontend message and the number of finished processes.
export async function changeClassificationState(
  classificationState: string
): Promise<{ displayValue: string; currentProcess: number }> {
  // Define the base states of the Classification process values.
  let processMessage = '';
  let completedProcesses = 0;

  // Use switch case to define behavior based on the state string.
  // States are always set prior to the related action being started.
  switch (classificationState) {
    // State handlers define when to show and hide the Classification state modal.
    // Also defines what is currently being done in the Classification and the number of completed steps.
    case 'Start Classify':
      // Defines the start of the process and shows the state tracker modal.
      processMessage = 'Starting classification process.';
      break;
    case 'Synthetic Login':
      processMessage = 'Clasibot bookkeeper logging in.';
      completedProcesses = 1;
      break;
    case 'Get For Review Transactions':
      processMessage = 'Fetching new transactions for review.';
      completedProcesses = 2;
      break;
    case 'Get Saved Transactions':
      processMessage = 'Checking previously classified transactions.';
      completedProcesses = 3;
      break;
    case 'Classify For Review Transactions':
      processMessage = 'Classifying the new transactions.';
      completedProcesses = 4;
      break;
    case 'Create New Classified Transactions':
      processMessage = 'Creating the new classified transactions.';
      completedProcesses = 5;
      break;
    case 'Save New Classified Transactions':
      processMessage = 'Saving your newly classified transactions.';
      completedProcesses = 6;
      break;
    case 'Load New Classified Transactions':
      processMessage = 'Loading your transaction review table.';
      completedProcesses = 7;
      break;
    case 'Classify Complete':
      processMessage = 'Classification Complete!';
      completedProcesses = 8;
      break;
    case 'Error':
      processMessage = 'An Unexpected Error Occured';
      completedProcesses = -1;
      break;
  }
  return { displayValue: processMessage, currentProcess: completedProcesses };
}