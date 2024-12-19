'use server';

import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

import { db } from '@/db/index';
import {
  ForReviewTransaction,
  Category,
  ForReviewTransactionToCategories,
  TaxCode as DatabaseTaxCode,
  ForReviewTransactionToTaxCodes,
} from '@/db/schema';
import { eq } from 'drizzle-orm';

import { checkConfidenceValue } from '@/actions/helpers/index';

import { getAccounts, getTaxCodes } from '@/actions/quickbooks/index';

import type {
  Account,
  ClassifiedElement,
  ClassifiedForReviewTransaction,
  RawForReviewTransaction,
  QueryResult,
  TaxCode,
} from '@/types/index';

// Returns: An array of Sub-arrays in the format [ClassifiedForReviewTransaction, RawForReviewTransaction]
export async function getDatabaseTransactions(): Promise<{
  queryResult: QueryResult;
  transactions: (ClassifiedForReviewTransaction | RawForReviewTransaction)[][];
}> {
  try {
    // Get the current session to extract the realm Id.
    const session = await getServerSession(options);

    // Create an array to store the Classified and Raw 'For Review' transactions.
    const classifiedTransactions: (
      | ClassifiedForReviewTransaction
      | RawForReviewTransaction
    )[][] = [];

    // Get the the 'Expense' and 'Transaction' Accounts.
    const transactionAccountsResult = await getAccounts('Transaction');
    const expenseAccountsResult = await getAccounts('Expense');

    // Check if the Account fetches resulted in an error.
    if (
      (transactionAccountsResult[0] as QueryResult).result === 'Error' ||
      (expenseAccountsResult[0] as QueryResult).result === 'Error'
    ) {
      // Define the Account fetch error Query Result.
      const errorResult: QueryResult = {
        result: 'Error',
        message: 'Error Loading User Accounts',
        detail: '',
      };

      // Add the error detail for the Account fetches that resulted in an error.
      if ((transactionAccountsResult[0] as QueryResult).result === 'Error') {
        errorResult.detail =
          'Transaction Account Error, Detail:' +
          (transactionAccountsResult[0] as QueryResult).detail +
          '\n';
      }
      if ((expenseAccountsResult[0] as QueryResult).result === 'Error') {
        errorResult.detail =
          errorResult.detail +
          'Expense Account Error, Detail:' +
          (expenseAccountsResult[0] as QueryResult).detail;
      }

      // Return an error Query Result and an empty array for the 'For Review' transactions.
      return { queryResult: errorResult, transactions: [] };
    }

    // Get the list of Tax Codes.
    const taxCodesResponse = await getTaxCodes();

    // Check if the Tax Code fetch resulted in an error.
    if ((taxCodesResponse[0] as QueryResult).result === 'Error') {
      // Return an error Query Result and an empty array for the 'For Review' transactions.
      return {
        queryResult: {
          result: 'Error',
          message: 'Error Loading User Tax Codes',
          detail: (taxCodesResponse[0] as QueryResult).detail,
        },
        transactions: [],
      };
    }

    // If the realm Id is present, fetch all database 'For Review' transactions for that Company.
    if (session?.realmId) {
      // Use the unique realm Id to get the 'For Review' transactions.
      const classifiedForReviewTransactions = await db
        .select()
        .from(ForReviewTransaction)
        .where(eq(ForReviewTransaction.companyId, session!.realmId));

      // Iterate through the fetched 'For Review' transactions.
      for (const forReviewTransaction of classifiedForReviewTransactions) {
        // Extract the data from the 'For Review' transaction to create the Raw 'For Review' transaction format.
        const rawTransaction: RawForReviewTransaction = {
          id: forReviewTransaction.id,
          olbTxnId: forReviewTransaction.reviewTransactionId,
          qboAccountId: forReviewTransaction.accountId,
          description: forReviewTransaction.description,
          origDescription: forReviewTransaction.origDescription,
          amount: Number(forReviewTransaction.amount),
          olbTxnDate: forReviewTransaction.date,
          acceptType: forReviewTransaction.acceptType,
          addAsQboTxn: {
            txnTypeId: forReviewTransaction.transactionTypeId,
            nameId: forReviewTransaction.payeeNameId,
          },
        };

        // Call helpers to convert the Classification data to Classified Elements.
        const transactionCategories: ClassifiedElement[] =
          await getTransactionCategories(
            forReviewTransaction,
            expenseAccountsResult
          );
        const transactionTaxCodes: ClassifiedElement[] =
          await getTransactionTaxCodes(forReviewTransaction, taxCodesResponse);

        // Convert the 'Transaction' Account fetch result to a list of Accounts.
        const checkedAccounts = transactionAccountsResult.slice(1) as Account[];

        // Iterate through 'Transaction' Accounts to find the match for the Account of the 'For Review' transaction.
        for (const account of checkedAccounts) {
          // Check if the Account is a match.
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
              transaction_Id: forReviewTransaction.id,
              name: forReviewTransaction.description,
              date: forReviewTransaction.date,
              account: forReviewTransaction.accountId,
              accountName: account.name,
              amount: Number(forReviewTransaction.amount),
              categories: transactionCategories,
              categoryConfidence: categoryConfidence,
              taxCodes: transactionTaxCodes,
              taxCodeConfidence: taxCodeCondifence,
            };

            // Add both the Classified and Raw 'For Review' transactions to the array.
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
    // Catch any errors and create an error Query Result, include the error message if it is present.
    // Return an empty array for the 'For Review' transactions on error, as the fetch failed.
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
          detail: 'Unexpected Error Occured',
        },
        transactions: [],
      };
    }
  }
}

// Define the data formatting of the 'For Review' transactions fetched from the database.
type DatabaseForReviewTransaction = {
  date: string;
  id: string;
  description: string;
  origDescription: string;
  acceptType: string;
  companyId: string;
  reviewTransactionId: string;
  accountId: string;
  amount: string;
  payeeNameId: string | null;
  transactionTypeId: string;
  topCategoryClassification: string;
  topTaxCodeClassification: string;
};

// Takes: A database 'For Review' transaction and the 'Expense' Accounts.
// Returns: An array of Classified Elements for the related Categories.
async function getTransactionCategories(
  forReviewTransaction: DatabaseForReviewTransaction,
  expenseAccountsResult: (QueryResult | Account)[]
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

    // Define an array to store the new Classified Elements.
    const classifiedCategories: ClassifiedElement[] = [];

    // Remove the Query Result in the first index of the 'Expense' Accounts.
    const checkedAccounts = expenseAccountsResult.slice(1) as Account[];

    // Iterate through the Category Relationships for the 'For Review' transaction.
    for (const category of transactionCategories) {
      // Use the unique Relationship Id to get the Category.
      const fullCategory = await db
        .select()
        .from(Category)
        .where(eq(Category.id, category.categoryId));

      // Iterate through the 'Expense' Accounts.
      for (const expenseAccount of checkedAccounts) {
        // Check if the Account has the a matching name.
        if (expenseAccount.name === fullCategory[0].category) {
          // Use the Category and Transaction to create the Classified Element.
          // Push the defined Classification with the type 'Category'.
          classifiedCategories.push({
            type: 'Category',
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
    // Catch and log any errors, include the error message if it is present.
    if (error instanceof Error) {
      console.error('Error Getting Transaction Categories: ' + error.message);
    } else {
      console.error('Unexpected Error Getting Transaction Categories.');
    }
    // Return an empty array on error, as the Category Classification process failed.
    return [];
  }
}

// Takes: A database 'For Review' transaction and the Tax Codes.
// Returns: An array of Classified Elements for the related Tax Codes.
async function getTransactionTaxCodes(
  forReviewTransaction: DatabaseForReviewTransaction,
  taxCodesResponse: (QueryResult | TaxCode)[]
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

    // Define an array to store the new Classified Elements.
    const classifiedTaxCodes: ClassifiedElement[] = [];

    // Remove the Query Result in the first index of the Tax Codes response.
    const qboTaxCodes = taxCodesResponse.slice(1) as TaxCode[];

    // Iterate through the Tax Code Relationships for the 'For Review' transaction.
    for (const taxCode of transactionTaxCodes) {
      // Use the unique Relationship Id to get the Tax Code.
      const fullTaxCode = await db
        .select()
        .from(DatabaseTaxCode)
        .where(eq(DatabaseTaxCode.id, taxCode.taxCodeId));

      // Iterate through the Tax Codes.
      for (const qboTaxCode of qboTaxCodes) {
        // Check if the Tax Code has the a matching name.
        if (qboTaxCode.Name === fullTaxCode[0].taxCode) {
          // Use the Tax Code and Transaction to create the Classified Element.
          // Push the defined Classification to the database with the type 'Tax Code'.
          classifiedTaxCodes.push({
            type: 'Tax Code',
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
    // Catch and log any errors, include the error message if it is present.
    if (error instanceof Error) {
      console.error('Error Getting Transaction Tax Codes: ' + error.message);
    } else {
      console.error('Unexpected Error Getting Transaction Tax Codes.');
    }
    // Return an empty array on error, as the Tax Code Classification process failed.
    return [];
  }
}
