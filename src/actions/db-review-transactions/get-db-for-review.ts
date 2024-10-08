'use server';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import { db } from '@/db/index';
import {
  ForReviewTransaction as DatabaseForReviewTransaction,
  ForReviewTransactionToCategories,
  Category,
  ForReviewTransactionToTaxCodes,
  TaxCode,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAccounts } from '../quickbooks/get-accounts';
import { getTaxCodes } from '../quickbooks/taxes';
import type { ClassifiedElement } from '@/types/Classification';
import type {
  ForReviewTransaction,
  ClassifiedForReviewTransaction,
} from '@/types/ForReviewTransaction';

export async function getDatabaseTransactions(): Promise<
  (ForReviewTransaction | ClassifiedForReviewTransaction)[][]
> {
  // Get the session to get the companies ID (realm ID).
  const session = await getServerSession(options);
  // Create an array to store the raw and classified 'for review' transactions.
  const classifiedTransactions: (
    | ForReviewTransaction
    | ClassifiedForReviewTransaction
  )[][] = [];

  // If the realm ID is present, fetch all DB transactions for that company.
  if (session?.realmId) {
    const classifiedForReviewTransactions = await db
      .select()
      .from(DatabaseForReviewTransaction)
      .where(eq(DatabaseForReviewTransaction.companyId, session?.realmId));

    // Iterate through the fetched transactions to get their classifications and save them to the array.
    for (const forReviewTransaction of classifiedForReviewTransactions) {
      // Define the raw transaction needed for the saving process later.
      const rawTransaction: ForReviewTransaction = {
        id: forReviewTransaction.id,
        olbTxnId: forReviewTransaction.transactionId,
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

      // Call method to get the categories and tax codes for the transaction as classified elements.
      const transactionCategories: ClassifiedElement[] =
        await getTransactionCategories(forReviewTransaction);

      const transactionTaxCodes: ClassifiedElement[] =
        await getTransactionTaxCodes(forReviewTransaction);

      // Get the possible transaction accounts to find the transaction's account name.
      const transactionAccounts = JSON.parse(await getAccounts('Transaction'));
      // Iterate through the accounts to find the matching one and use its name to make the classified 'for review' transaction.
      for (const account of transactionAccounts) {
        if (account.id === forReviewTransaction.accountId) {
          // Create the classified 'for review' transaction for the database transaction.
          const classifiedTransaction: ClassifiedForReviewTransaction = {
            // ID for the 'For Review' transaction.
            transaction_ID: forReviewTransaction.id,
            name: forReviewTransaction.description,
            date: forReviewTransaction.date,
            account: forReviewTransaction.accountId,
            accountName: account.name,
            amount: forReviewTransaction.amount,
            categories: transactionCategories,
            taxCodes: transactionTaxCodes,
          };
          classifiedTransactions.push([classifiedTransaction, rawTransaction]);
        }
      }
    }
  }
  // Return the array of classified transactions and their related raw transaction.
  // Array will be empty if a valid realm ID could not be found from the session.
  return classifiedTransactions;
}

// Define the data format of the transactions fetched from the database.
type databaseForReviewTransaction = {
  date: string;
  id: string;
  description: string;
  companyId: string;
  transactionId: string;
  accountId: string;
  origDescription: string;
  amount: number;
  acceptType: string;
  payeeNameId: string | null;
  transactionTypeId: string;
  topCategoryClassification: string;
  topTaxCodeClassification: string;
  approved: boolean;
};

async function getTransactionCategories(
  forReviewTransaction: databaseForReviewTransaction
) {
  // Get the categories related to the transaction and create an array to store them.
  const transactionCategories = await db
    .select()
    .from(ForReviewTransactionToCategories)
    .where(
      eq(
        ForReviewTransactionToCategories.transactionId,
        forReviewTransaction.id
      )
    );
  const classifiedCategories: ClassifiedElement[] = [];

  // Get the list of expense accounts for the user to use to get the ID of the fetched categories.
  const expenseAccountsResponse = JSON.parse(await getAccounts('Expense'));

  // Check if the query was successful and continue with the rest of the accounts if it is.
  if (expenseAccountsResponse[0].result === 'Success') {
    // Define the rest of the expense accounts
    const expenseAccounts = expenseAccountsResponse.split(1);

    // Iterate through the related categories to get them from the database.
    for (const category of transactionCategories) {
      // Use the ID to get the related category from the database.
      const fullCategory = await db
        .select()
        .from(Category)
        .where(eq(Category.id, category.categoryId));

      // Iterate through the user accounts to find the account with the matching name.
      for (const expenseAccount of expenseAccounts) {
        // Once the account with the matching name is found, use it to get the id of the account related to the category.
        if (expenseAccount.name === fullCategory[0].category) {
          // Push a new classified element to the array of classified categories.
          classifiedCategories.push({
            type: 'category',
            id: expenseAccount.id,
            name: fullCategory[0].category,
            classifiedBy: forReviewTransaction.topCategoryClassification,
          });
        }
      }
    }
  }
  // Return the (potentially empty) array of classified elements for the related categories.
  return classifiedCategories;
}

async function getTransactionTaxCodes(
  forReviewTransaction: databaseForReviewTransaction
) {
  // Get the tax codes related to the transaction and create an array to store them.
  const transactionTaxCodes = await db
    .select()
    .from(ForReviewTransactionToTaxCodes)
    .where(
      eq(ForReviewTransactionToTaxCodes.transactionId, forReviewTransaction.id)
    );
  const classifiedTaxCodes: ClassifiedElement[] = [];

  // Get the list of expense accounts for the user to use to get the ID of the fetched tax codes.
  const taxCodesResponse = JSON.parse(await getTaxCodes());

  // Check if the query was successful and continue with the rest of the accounts if it is.
  if (taxCodesResponse[0].result === 'Success') {
    // Define the rest of the expense accounts
    const qboTaxCodes = taxCodesResponse.split(1);

    // Iterate through the related tax codes to get them from the database.
    for (const taxCode of transactionTaxCodes) {
      // Use the ID to get the related tax code from the database.
      const fullTaxCode = await db
        .select()
        .from(TaxCode)
        .where(eq(TaxCode.id, taxCode.taxCodeId));

      // Iterate through the user tax codes to find the one with the matching name.
      for (const qboTaxCode of qboTaxCodes) {
        // Once the tax code with the matching name is found, use it to get the id of the related tax code.
        if (qboTaxCode.Name === fullTaxCode[0].taxCode) {
          // Push a new classified element to the array of classified tax codes.
          classifiedTaxCodes.push({
            type: 'category',
            id: qboTaxCode.Id,
            name: fullTaxCode[0].taxCode,
            classifiedBy: forReviewTransaction.topTaxCodeClassification,
          });
        }
      }
    }
  }
  // Return the (potentially empty) array of classified elements for the related tax codes.
  return classifiedTaxCodes;
}
