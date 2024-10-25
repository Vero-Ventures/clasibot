'use server';
import { getForReview } from '@/actions/backend-actions/get-for-review';
import { addForReviewTransactions } from '@/actions/backend-actions/database-functions/add-db-for-review';
import { getAccounts } from '@/actions/quickbooks/get-accounts';
import { getSavedTransactions } from '@/actions/quickbooks/get-saved-transactions';
import {
  getCompanyIndustry,
  getCompanyLocation,
  getCompanyName,
} from '@/actions/quickbooks/user-info';
import { classifyTransactions } from './classify';
import type { Account } from '@/types/Account';
import type { ClassifiedElement } from '@/types/Classification';
import type { CompanyInfo } from '@/types/CompanyInfo';
import type {
  ForReviewTransaction,
  FormattedForReviewTransaction,
  ClassifiedForReviewTransaction,
} from '@/types/ForReviewTransaction';
import type { LoginTokens } from '@/types/LoginTokens';
import type { QueryResult } from '@/types/QueryResult';
import type { Transaction } from '@/types/Transaction';

// Classifies and saves the 'For Review' transactions for a specific Company.
// Takes: The tokens retrived from synthetic login and the realm Id of the Company.
// Manual Classification Specific:
//        Boolean value for Classification method (true for frontend call) a callback function for updating frontend state.
// Returns: The Query Result from 'For Review' transaction saving function or an error Query Result.
export async function classifyCompany(
  loginTokens: LoginTokens,
  companyId: string,
  manualClassify: boolean = false,
  setFrontendState: ((newState: string) => void) | null = null
): Promise<QueryResult> {
  try {
    // Manual Classification: Update frontend state for fetching 'For Review' transactions.
    if (manualClassify) setFrontendState!('Loading New Transactions ... ');

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

    // Manual Classification: Update frontend state for fetching saved Classified Transactions.
    if (manualClassify) setFrontendState!('Getting Transaction History ... ');

    // Get the saved Classified Transactions from the User to use as context for prediction.
    const classifiedPastTransactions = await getClassifiedPastTransactions(
      loginTokens,
      companyId
    );

    // Extract the formatted 'For Review' transactions to use in Classification.
    const formattedForReviewTransactions = forReviewTransactions.map(
      (subArray) => subArray[0] as FormattedForReviewTransaction
    );

    // Get Company Info for the User as context during LLM predictions.
    const companyInfo = await getCompanyInfo(loginTokens, companyId);

    // Manual Classification: Update frontend state to indicate start of Classification.
    if (manualClassify) setFrontendState!('Classifying New Transactions ... ');

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
      loginTokens,
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

      // Manual Classification: Update frontend state to indicate Classified 'For Review' transaction creation.
      if (manualClassify) setFrontendState!('Evaluating Classifications ... ');

      // Use Classification results to create Classified 'For Review' transaction objects.
      const classifiedForReviewTransactions =
        createClassifiedForReviewTransactions(
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
          message: 'Error Creating Classified For Review Transactions',
          detail: 'Unexpected Error',
        };
      }

      // Manual Classification: Update frontend state to indicate saving Classified 'For Review' transactions to database.
      if (manualClassify) setFrontendState!('Saving Classifications ... ');

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
// Takes: The tokens retrived from synthetic login and the realm Id of the Company.
// Returns: An array of Sub-arrays in the format: [FormattedForReviewTransaction, ForReviewTransaction]
async function getForReviewTransactions(
  loginTokens: LoginTokens,
  companyId: string
): Promise<
  (FormattedForReviewTransaction | ForReviewTransaction)[][] | QueryResult
> {
  try {
    // Get all Accounts that may contain 'For Review' transactions.
    const response = await getAccounts('Transaction', loginTokens, companyId);
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
        const result = await getForReview(account.id, loginTokens, companyId);

        // Check if the 'For Review' transaction fetch resulted in error.
        if (result.result === 'Error') {
          // For error Query Results, return the Query Result generated by the 'For Review' transaction fetching.
          return result;
        } else {
          // If the fetch Query Result is a success, save the resulting 'For Review' transactions.
          // Parse the detail value of the Query Result into an array of Sub-arrays ([FormattedForReviewTransaction, ForReviewTransaction]).
          // Add the newly found 'For Review' transactions to the array of all fetched 'For Review' transactions.
          const resultTransactions: (
            | FormattedForReviewTransaction
            | ForReviewTransaction
          )[][] = JSON.parse(result.detail);
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
      console.error('Error Getting For Review Transactions:' + error.message);
      return {
        result: 'Error',
        message: 'An Unexpected Error Occured While Getting Transactions',
        detail: error.message,
      };
    } else {
      console.error('Error: Unexpected Error Getting For Review Transactions');
      return {
        result: 'Error',
        message: 'An Unexpected Error Occured While Getting Transactions',
        detail: 'N/A',
      };
    }
  }
}

// Gets the saved and Classified Transactions from the Company for use in LLM prediction.
// Takes: The tokens retrived from synthetic login and the realm Id of the Company.
// Returns: An array of transactions objects for the User Classified transactions.
async function getClassifiedPastTransactions(
  loginTokens: LoginTokens,
  companyId: string
): Promise<Transaction[]> {
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
    const response = await getSavedTransactions(
      startDate,
      endDate,
      loginTokens,
      companyId
    );
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
// Takes: The tokens retrived from synthetic login and the realm Id of the Company.
// Returns: The relevant Company Info object.
async function getCompanyInfo(
  loginTokens: LoginTokens,
  companyId: string
): Promise<CompanyInfo> {
  try {
    // Get the Company Info values from the current Company.
    const userCompanyName = await getCompanyName(loginTokens, companyId);
    const userCompanyIndustry = await getCompanyIndustry(
      loginTokens,
      companyId
    );
    const userCompanyLocation = await getCompanyLocation(
      loginTokens,
      companyId
    );
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
//    Also takes a record of Transaction Id to arrays of the Classifications.
// Returns: The 'For Review' transaction array converted to Sub-arrays of [ClassifiedForReviewTransactions, ForReviewTransaction].
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

      // Define inital null values for the Classifications.
      let categoryClassification = null;
      let taxCodeClassification = null;

      // Extract the value for the current 'For Review' transaction from the passed 'For Review' transaction record.
      const transactionClassifications =
        nonNullResult[formattedTransaction.transaction_Id];

      // Check if the Classification result values for the current 'For Review' transaction are present.
      if (transactionClassifications) {
        // Use the extracted values to update the Classifications.
        categoryClassification = transactionClassifications.category;
        taxCodeClassification = transactionClassifications.taxCode;
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
          taxCodes: taxCodeClassification,
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
