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
import { getAccounts } from '@/actions/quickbooks/get-accounts';
import { getTaxCodes } from '@/actions/quickbooks/taxes';
import type { Account } from '@/types/Account';
import type { ClassifiedElement } from '@/types/Classification';
import type {
  ForReviewTransaction,
  ClassifiedForReviewTransaction,
} from '@/types/ForReviewTransaction';
import type { TaxCode } from '@/types/TaxCode';

// Gets the 'For Review' transactions saved to the database for the current user.
// Returns: An array of sub-arrays in the format [ClassifiedForReviewTransaction, ForReviewTransaction]
export async function getDatabaseTransactions(): Promise<
  (ClassifiedForReviewTransaction | ForReviewTransaction)[][]
> {
  try {
    // Get the current session to extract the companies realmId.
    const session = await getServerSession(options);

    // Create an array to store the classified and raw 'For Review' transactions.
    const classifiedTransactions: (
      | ClassifiedForReviewTransaction
      | ForReviewTransaction
    )[][] = [];

    // If the realm Id is present, fetch all database 'For Review' transactions for that company.
    if (session?.realmId) {
      const classifiedForReviewTransactions = await db
        .select()
        .from(DatabaseForReviewTransaction)
        .where(eq(DatabaseForReviewTransaction.companyId, session!.realmId));

      // Iterate through the fetched 'For Review' transactions to convert them from the database formatting to the require object types.
      for (const forReviewTransaction of classifiedForReviewTransactions) {
        // Extract the data from the DB 'For Review' transaction to create the raw transaction format.
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

        // Call helper to convert the database data to the needed classified elements.
        const transactionCategories: ClassifiedElement[] =
          await getTransactionCategories(forReviewTransaction);

        const transactionTaxCodes: ClassifiedElement[] =
          await getTransactionTaxCodes(forReviewTransaction);

        // Get the possible transaction accounts from the user to find the transaction's account name.
        const transactionAccountsResult = JSON.parse(
          await getAccounts('Transaction')
        );

        // Check if the fetch resulted in an error.
        if (transactionAccountsResult[0].result === 'Error') {
          // Log the error message and detail and continue to the end of the iteration.
          // Iteration will return an empty array as no values will be pushed.
          console.error(
            transactionAccountsResult[0].message +
              ', Detail: ' +
              transactionAccountsResult[0].detail
          );
        } else {
          // If the call did not result in an error, remove the Query Result from the first index.
          const checkedAccounts = transactionAccountsResult.slice(1);

          // Iterate through the transaction accounts to find the one matching the 'For Review' transactions account Id.
          // Needed to record its name to make the classified 'For Review' transaction (For frontend selection).
          for (const account of checkedAccounts) {
            // Once the account with the matching name is found,
            if (account.id === forReviewTransaction.accountId) {
              // Create the classified 'For Review' transaction.
              // Uses the transaction details from the fetched database 'For Review' transaction, -
              // classifications from the helper methods, and account name from the related account.
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

              // Add both the classified and raw 'For Review' transaction objects to the array.
              classifiedTransactions.push([
                classifiedTransaction,
                rawTransaction,
              ]);
            }
          }
        }
      }
    }
    // Return the array of classified and raw 'For Review' transactions.
    // Array will be empty if a valid realm ID could not be found from the session.
    return classifiedTransactions;
  } catch (error) {
    // Catch any errors and return an error response with the error message if it present.
    if (error instanceof Error) {
      console.error(
        'Error Getting For Review Transactions From Database: ' + error.message
      );
    } else {
      console.error(
        'Unexpected Error Getting For Review Transactions From Database.'
      );
    }
    // Return an empty array on error, to indicate no fetched database 'For Review' transactions.
    return [];
  }
}

// Define the data format of the transactions fetched from the database.
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

// Takes a database 'For Review' transaction and finds its assosiated category classifications in the database.
// Returns: Converts the database category classifications to an array of ClassifiedElements.
async function getTransactionCategories(
  forReviewTransaction: databaseForReviewTransaction
): Promise<ClassifiedElement[]> {
  try {
    // Get the categories related to the transaction by its Id.
    const transactionCategories = await db
      .select()
      .from(ForReviewTransactionToCategories)
      .where(
        eq(
          ForReviewTransactionToCategories.reviewTransactionId,
          forReviewTransaction.id
        )
      );

    // Define an array to store the re-formatted classifications as Classified Elements.
    const classifiedCategories: ClassifiedElement[] = [];

    // Get the list of expense accounts for the user, used to get the ID of the fetched categories.
    const expenseAccountsResult = JSON.parse(await getAccounts('Expense'));

    // Check if the fetch resulted in an error.
    if (expenseAccountsResult[0].result === 'Error') {
      // Log the error message and detail from the inital Query Result index and continue to the end of the function.
      // Function will return an empty array as no values will be pushed.
      console.error(
        expenseAccountsResult[0].message +
          ', Detail: ' +
          expenseAccountsResult[0].detail
      );
    } else {
      // If the call did not result in an error, remove the Query Result in the first index.
      const checkedAccounts = expenseAccountsResult.slice(1) as Account[];

      // Iterate through the category classification relationships for the 'For Review' transaction.
      for (const category of transactionCategories) {
        // Use the ID from the relationship to get the category classification from the database.
        const fullCategory = await db
          .select()
          .from(Category)
          .where(eq(Category.id, category.categoryId));

        // Iterate through the user accounts to find the account with the matching name.
        for (const expenseAccount of checkedAccounts) {
          // Once the account with the matching name is found,
          if (expenseAccount.name === fullCategory[0].category) {
            // Use the found account to define the ID and name, and the transaction to define the classification method.
            // Push the defined classification to the database with the type 'category'.
            classifiedCategories.push({
              type: 'category',
              id: expenseAccount.id,
              name: expenseAccount.name,
              classifiedBy: forReviewTransaction.topCategoryClassification,
            });
          }
        }
      }
    }
    // Return the (potentially empty from error catch) array of classified elements for the related categories.
    return classifiedCategories;
  } catch (error) {
    // Catch any errors and return an error response with the error message if it present.
    if (error instanceof Error) {
      console.error('Error Getting Transaction Categories: ' + error.message);
    } else {
      console.error('Unexpected Error Getting Transaction Categories.');
    }
    // Return an empty array on error, to indicate no related category classifications.
    return [];
  }
}

// Takes a database 'For Review' transaction and finds its assosiated tax code classifications in the database.
// Returns: Converts the database tax code classifications to an array of ClassifiedElements.
async function getTransactionTaxCodes(
  forReviewTransaction: databaseForReviewTransaction
): Promise<ClassifiedElement[]> {
  try {
    // Get the tax cpdes related to the transaction by its Id.
    const transactionTaxCodes = await db
      .select()
      .from(ForReviewTransactionToTaxCodes)
      .where(
        eq(
          ForReviewTransactionToTaxCodes.reviewTransactionId,
          forReviewTransaction.id
        )
      );

    // Define an array to store the re-formatted classifications as Classified Elements.
    const classifiedTaxCodes: ClassifiedElement[] = [];

    // Get the list of tax codes for the user, used to get the ID of the fetched tax codes.
    const taxCodesResponse = JSON.parse(await getTaxCodes());

    // Check if the fetch resulted in an error.
    if (taxCodesResponse[0].result === 'Error') {
      // Log the error message and detail from the inital Query Result index and continue to the end of the function.
      // Function will return an empty array as no values will be pushed.
      console.error(
        taxCodesResponse[0].message + ', Detail: ' + taxCodesResponse[0].detail
      );
    } else {
      // If the call did not result in an error, remove the Query Result in the first index.
      const qboTaxCodes = taxCodesResponse.split(1) as TaxCode[];

      // Iterate through the tax code classification relationships for the 'For Review' transaction.
      for (const taxCode of transactionTaxCodes) {
        // Use the ID from the relationship to get the tax code classification from the database.
        const fullTaxCode = await db
          .select()
          .from(DatabaseTaxCode)
          .where(eq(DatabaseTaxCode.id, taxCode.taxCodeId));

        // Iterate through the user tax codes to find the one with the matching name.
        for (const qboTaxCode of qboTaxCodes) {
          // Once the tax code with the matching name is found,
          if (qboTaxCode.Name === fullTaxCode[0].taxCode) {
            // Use the found account to define the ID and name, and the transaction to define the classification method.
            // Push the defined classification to the database with the type 'tax code'.
            classifiedTaxCodes.push({
              type: 'tax code',
              id: qboTaxCode.Id,
              name: qboTaxCode.Name,
              classifiedBy: forReviewTransaction.topTaxCodeClassification,
            });
          }
        }
      }
    }
    // Return the (potentially empty from error catch) array of classified elements for the related tax codes.
    return classifiedTaxCodes;
  } catch (error) {
    // Catch any errors and return an error response with the error message if it present.
    if (error instanceof Error) {
      console.error('Error Getting Transaction Tax Codes: ' + error.message);
    } else {
      console.error('Unexpected Error Getting Transaction Tax Codes.');
    }
    // Return an empty array on error, to indicate no related tax code classifications.
    return [];
  }
}
