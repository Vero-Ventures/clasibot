'use server';

import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

import { db } from '@/db/index';
import {
  ForReviewTransaction as DatabaseForReviewTransaction,
  ForReviewTransactionToCategories,
  Category,
  ForReviewTransactionToTaxCodes,
  TaxCode as DatabaseTaxCode,
} from '@/db/schema';
import { eq } from 'drizzle-orm';

import { checkConfidenceValue } from '@/actions/check-confidence-value';

import { getAccounts, getTaxCodes } from '@/actions/quickbooks/index';

import type {
  Account,
  ClassifiedElement,
  ForReviewTransaction,
  ClassifiedForReviewTransaction,
  QueryResult,
  TaxCode,
} from '@/types/index';

// Gets the 'For Review' transactions saved to the database for the current User.
// Returns: An array of Sub-arrays in the format [ClassifiedForReviewTransaction, ForReviewTransaction]
export async function getDatabaseTransactions(): Promise<{
  queryResult: QueryResult;
  transactions: (ClassifiedForReviewTransaction | ForReviewTransaction)[][];
}> {
  try {
    // Get the current session to extract the Company realm Id.
    const session = await getServerSession(options);

    // Create an array to store the Classified and Raw 'For Review' transactions.
    const classifiedTransactions: (
      | ClassifiedForReviewTransaction
      | ForReviewTransaction
    )[][] = [];

    // Get the the Expense and Transaction Accounts from the User.
    const transactionAccountsResult = JSON.parse(
      await getAccounts('Transaction')
    );
    const expenseAccountsResult = JSON.parse(await getAccounts('Expense'));

    // Check if the Account fetch resulted in an error.
    if (
      transactionAccountsResult[0].result === 'Error' ||
      expenseAccountsResult[0].result === 'Error'
    ) {
      // Define the Account fetch error Query Result.
      const errorResult: QueryResult = {
        result: 'Error',
        message: 'Error Loading User Accounts',
        detail: '',
      };

      // Add the error detail for the Transaction and Expense Account queries if present.
      if (transactionAccountsResult[0].result === 'Error') {
        errorResult.detail =
          'Transaction Account Error, Detail:' +
          transactionAccountsResult[0].detail +
          '\n';
      }
      if (expenseAccountsResult[0].result === 'Error') {
        errorResult.detail =
          errorResult.detail +
          'Expense Account Error, Detail:' +
          expenseAccountsResult[0].detail;
      }

      // Return the error Query Result and an empty array of Classified 'For Review' Transactions.
      return { queryResult: errorResult, transactions: [] };
    }

    // Get the list of Tax Codes for the User.
    const taxCodesResponse = JSON.parse(await getTaxCodes());

    // Check if the Tax Code fetch resulted in an error.
    if (taxCodesResponse[0].result === 'Error') {
      // Return the error Query Result and an empty array of Classified 'For Review' Transactions.
      return {
        queryResult: {
          result: 'Error',
          message: 'Error Loading User Tax Codes',
          detail: taxCodesResponse[0].detail,
        },
        transactions: [],
      };
    }

    // If the Company realm Id is present, fetch all database 'For Review' transactions for that Company.
    if (session?.realmId) {
      const classifiedForReviewTransactions = await db
        .select()
        .from(DatabaseForReviewTransaction)
        .where(eq(DatabaseForReviewTransaction.companyId, session!.realmId));

      // Iterate through the fetched 'For Review' transactions.
      for (const forReviewTransaction of classifiedForReviewTransactions) {
        // Extract the data from the DB 'For Review' transaction to create the raw 'For Review' transaction format.
        // The raw format is needed for writing to the QuickBooks database in the saving process later.
        const rawTransaction: ForReviewTransaction = {
          id: forReviewTransaction.id,
          olbTxnId: forReviewTransaction.reviewTransactionId,
          qboAccountId: forReviewTransaction.accountId,
          description: forReviewTransaction.description,
          origDescription: forReviewTransaction.origDescription,
          amount: forReviewTransaction.amount,
          olbTxnDate: forReviewTransaction.date,
          acceptType: forReviewTransaction.acceptType,
          addAsQboTxn: {
            txnTypeId: forReviewTransaction.transactionTypeId,
            nameId: forReviewTransaction.payeeNameId,
          },
        };

        // Call helper to convert the database data to Classified Element formatting.
        const transactionCategories: ClassifiedElement[] =
          await getTransactionCategories(
            forReviewTransaction,
            expenseAccountsResult
          );
        const transactionTaxCodes: ClassifiedElement[] =
          await getTransactionTaxCodes(forReviewTransaction, taxCodesResponse);

        // If the call did not result in an error, remove the Query Result from the first index.
        const checkedAccounts = transactionAccountsResult.slice(1);

        // Iterate through the Transaction Accounts to find the one matching the Account Id of the 'For Review' transaction.
        // Needed to record its name to make the Classified 'For Review' transaction (For frontend identification and selection).
        for (const account of checkedAccounts) {
          // Check if the matching Account has been found.
          if (account.id === forReviewTransaction.accountId) {
            // Get the confidence values for both Classifications.
            const categoryConfidence = checkConfidenceValue(
              forReviewTransaction.topCategoryClassification
            );
            const taxCodeCondifence = checkConfidenceValue(
              forReviewTransaction.topTaxCodeClassification
            );
            // Create the Classified 'For Review' transaction.
            const classifiedTransaction: ClassifiedForReviewTransaction = {
              // Id for the 'For Review' transaction.
              transaction_Id: forReviewTransaction.id,
              name: forReviewTransaction.description,
              date: forReviewTransaction.date,
              account: forReviewTransaction.accountId,
              accountName: account.name,
              amount: forReviewTransaction.amount,
              categories: transactionCategories,
              categoryConfidence: categoryConfidence,
              taxCodes: transactionTaxCodes,
              taxCodeConfidence: taxCodeCondifence,
            };

            // Add both the Classified and Raw 'For Review' transaction objects to the array.
            classifiedTransactions.push([
              classifiedTransaction,
              rawTransaction,
            ]);
          }
        }
      }
    }
    // Return the array of Classified and Raw 'For Review' transactions.
    // Array will be empty if a valid realm Id could not be found from the session.
    return {
      queryResult: {
        result: 'Success',
        message: 'Retrived Classified Transactions',
        detail:
          'Successfully Retrived Classified "For Review" Transactions From The Database',
      },
      transactions: classifiedTransactions,
    };
  } catch (error) {
    // Catch any errors and create an error Query Result object, include the error message if it is present.
    // Return an empty array on error, as the database fetch failed.
    if (error instanceof Error) {
      return {
        queryResult: {
          result: 'Error',
          message:
            'Error Getting Classified "For Review" Transactions From Database',
          detail: error.message,
        },
        transactions: [],
      };
    } else {
      return {
        queryResult: {
          result: 'Error',
          message:
            'Error Getting Classified "For Review" Transactions From Database',
          detail: 'Unexpected Error',
        },
        transactions: [],
      };
    }
  }
}

// Define the data formatting of the 'For Review' transactions fetched from the database.
type databaseForReviewTransaction = {
  date: string;
  id: string;
  description: string;
  origDescription: string;
  acceptType: string;
  companyId: string;
  reviewTransactionId: string;
  accountId: string;
  amount: number;
  payeeNameId: string | null;
  transactionTypeId: string;
  topCategoryClassification: string;
  topTaxCodeClassification: string;
};

// Gets the Classified Elements for the Categories assosiated with a 'For Review' transaction saved to the database.
// Takes: A database 'For Review' transaction and the expense Accounts for the current User.
// Returns: An array of Classified Elements for the related Categories.
async function getTransactionCategories(
  forReviewTransaction: databaseForReviewTransaction,
  expenseAccountsResult: Account[]
): Promise<ClassifiedElement[]> {
  try {
    // Get the Transaction to Category Relationships by the Transaction Id.
    const transactionCategories = await db
      .select()
      .from(ForReviewTransactionToCategories)
      .where(
        eq(
          ForReviewTransactionToCategories.reviewTransactionId,
          forReviewTransaction.id
        )
      );

    // Define an array to store the Classifications re-formatted as Classified Elements.
    const classifiedCategories: ClassifiedElement[] = [];

    // Remove the Query Result in the first index of the Expense Accounts.
    const checkedAccounts = expenseAccountsResult.slice(1) as Account[];

    // Iterate through the Category Relationships for the 'For Review' transaction.
    for (const category of transactionCategories) {
      // Use the Id from the Relationship to get the database Category object.
      const fullCategory = await db
        .select()
        .from(Category)
        .where(eq(Category.id, category.categoryId));

      // Iterate through the Expense Accounts.
      for (const expenseAccount of checkedAccounts) {
        // Check if the Account has the a matching name.
        if (expenseAccount.name === fullCategory[0].category) {
          // Use the Tax Code and Transaction to create the Classified Element object.
          // Push the defined Classification to the database with the type 'category'.
          classifiedCategories.push({
            type: 'category',
            id: expenseAccount.id,
            name: expenseAccount.name,
            classifiedBy: forReviewTransaction.topCategoryClassification,
          });
        }
      }
    }
    // Return the (potentially empty) array of Classified Category Elements.
    return classifiedCategories;
  } catch (error) {
    // Catch any errors and return an error object, include the error message if it is present.
    if (error instanceof Error) {
      console.error('Error Getting Transaction Categories: ' + error.message);
    } else {
      console.error('Unexpected Error Getting Transaction Categories.');
    }
    // Return an empty array on error, as the Category Classification process failed.
    return [];
  }
}

// Gets the Classified Elements for the Tax Codes assosiated with a 'For Review' transaction saved to the database.
// Takes: A database 'For Review' transaction and the valid Tax Codes for the current User.
// Returns: An array of Classified Elements for the related Tax Codes.
async function getTransactionTaxCodes(
  forReviewTransaction: databaseForReviewTransaction,
  taxCodesResponse: TaxCode[]
): Promise<ClassifiedElement[]> {
  try {
    // Get the Transaction to Tax Code Relationships by the Transaction Id.
    const transactionTaxCodes = await db
      .select()
      .from(ForReviewTransactionToTaxCodes)
      .where(
        eq(
          ForReviewTransactionToTaxCodes.reviewTransactionId,
          forReviewTransaction.id
        )
      );

    // Define an array to store the Classifications re-formatted as Classified Elements.
    const classifiedTaxCodes: ClassifiedElement[] = [];

    // Remove the Query Result in the first index of the Tax Codes.
    const qboTaxCodes = taxCodesResponse.slice(1) as TaxCode[];

    // Iterate through the Tax Code Relationships for the 'For Review' transaction.
    for (const taxCode of transactionTaxCodes) {
      // Use the Id from the Relationship to get the database Tax Code object.
      const fullTaxCode = await db
        .select()
        .from(DatabaseTaxCode)
        .where(eq(DatabaseTaxCode.id, taxCode.taxCodeId));

      // Iterate through the Tax Codes.
      for (const qboTaxCode of qboTaxCodes) {
        // Check if the Tax Code has the a matching name.
        if (qboTaxCode.Name === fullTaxCode[0].taxCode) {
          // Use the Account and Transaction to create the Classified Element object.
          // Push the defined Classification to the database with the type 'tax code'.
          classifiedTaxCodes.push({
            type: 'tax code',
            id: qboTaxCode.Id,
            name: qboTaxCode.Name,
            classifiedBy: forReviewTransaction.topTaxCodeClassification,
          });
        }
      }
    }
    // Return the (potentially empty) array of Classified Tax Code Elements.
    return classifiedTaxCodes;
  } catch (error) {
    // Catch any errors and return an error object, include the error message if it is present.
    if (error instanceof Error) {
      console.error('Error Getting Transaction Tax Codes: ' + error.message);
    } else {
      console.error('Unexpected Error Getting Transaction Tax Codes.');
    }
    // Return an empty array on error, as the Tax Code Classification process failed.
    return [];
  }
}
