'use server';

import { db } from '@/db/index';
import {
  Transaction as DrizzleTransaction,
  TransactionsToCategories,
  Category,
  TaxCode,
  TransactionsToTaxCodes,
} from '@/db/schema';
import { eq } from 'drizzle-orm';

import type { QueryResult, Transaction } from '@/types/index';

// Saves Classified User Transactions for future Classification use.
// Takes: An array of saved User Transactions.
// Returns: A Query Result for saving the Transaction.
export async function addDatabaseTransactions(
  transactions: Transaction[]
): Promise<QueryResult> {
  try {
    // Iterate over the passed Transactions.
    for (const transaction of transactions) {
      // Make a variable to track the Id of the current Transaction.
      // The Id is used to update the Relationship tables.
      let transactionId = 0;

      // Check for any existing Transactions with the same name.
      const existingTransaction = await db
        .select()
        .from(DrizzleTransaction)
        .where(eq(DrizzleTransaction.transactionName, transaction.name));

      // Check if there is no existing Transaction for the Transaction name.
      if (!existingTransaction[0]) {
        // Create a new Transaction with that name.
        const newTransaction = await db
          .insert(DrizzleTransaction)
          .values({
            transactionName: transaction.name,
          })
          .returning();

        // Record the Id of the new Transaction.
        transactionId = newTransaction[0].id;
      } else {
        // If an existing Transaction is found for that name, record the Id.
        transactionId = existingTransaction[0].id;
      }

      // Get all of the Categories and Tax Codes present in the database.
      const categories = await db.select().from(Category);
      const taxCodes = await db.select().from(TaxCode);

      // Check the existing Classifications for ones that match the Transactions Classifications.
      const existingCategory = categories.find(
        (category) => category.category === transaction.category
      );
      const existingTaxCode = taxCodes.find(
        (taxCode) => taxCode.taxCode === transaction.taxCodeName
      );

      // Call helper methods to handle creating or updating the Classifications and Relationships for the Transaction.
      handleCategoryIncrement(existingCategory, transaction, transactionId);
      handleTaxCodeIncrement(existingTaxCode, transaction, transactionId);
    }

    // Return a success Query Response.
    return {
      result: 'Success',
      message: 'Transactions Were Saved To Database',
      detail: 'The Classified Saved User Transactions Were Saved Successfully',
    };
  } catch (error) {
    // Catch any errors and return an error Query Response, include the error message if it is present.
    if (error instanceof Error) {
      return {
        result: 'Error',
        message: 'An Unexpected Error Occured Adding Transaction to Database',
        detail: error.message,
      };
    } else {
      return {
        result: 'Error',
        message: 'An Unexpected Error Occured Adding Transaction to Database',
        detail: 'N/A',
      };
    }
  }
}

// Either increments the number of matches for an existing Category or makes a new Category with 1 match.
// Takes: A potentially undefined existing Category, the Transaction being saved, and the Id of the Transaction.
async function handleCategoryIncrement(
  existingCategory:
    | {
        id: number;
        category: string;
        matches: number;
      }
    | undefined,
  transaction: Transaction,
  transactionId: number
) {
  try {
    // Check if a non-null Category was passed.
    if (existingCategory) {
      // Get the Transaction to Category Relationships for the Transaction.
      const transactionCategories = await db
        .select()
        .from(TransactionsToCategories)
        .where(eq(TransactionsToCategories.transactionId, transactionId));

      // Check to see if the Transaction has a Relationship with the Category.
      const existingRelationship = transactionCategories.find(
        (relationship) => relationship.categoryId === existingCategory.id
      );

      if (!existingRelationship) {
        // If there is no existing Relationship, Create a new one between the Transactions and Categories.
        await db.insert(TransactionsToCategories).values({
          transactionId: transactionId,
          categoryId: existingCategory.id,
        });
      }

      // Update the number of matches to a Transaction the Category has.
      await db
        .update(Category)
        .set({
          matches: existingCategory.matches + 1,
        })
        .where(eq(Category.id, existingCategory.id));
    } else {
      // If there is no existing Category for the Classification, create a one.
      // Number of matches is set to one, as there is one valid connection for the Category (the current Transaction).
      const newCategory = await db
        .insert(Category)
        .values({
          category: transaction.category,
          matches: 1,
        })
        .returning();

      // Set the Relationship between the Transaction and new Category.
      await db.insert(TransactionsToCategories).values({
        transactionId: transactionId,
        categoryId: newCategory[0].id,
      });
    }
  } catch (error) {
    // Catch any errors and return an error response, include the error message if it is present.
    if (error instanceof Error) {
      console.error(
        'Error Incremeting Count Of Transaction Categories: ' + error.message
      );
    } else {
      console.error('Unexpected Error Count Of Transaction Categories.');
    }
  }
}

// Either increments the number of matches for an existing Tax Code or makes a new Tax Code with 1 match.
// Takes: A potentially undefined existing Tax Code, the Transaction being saved, and the Id of the Transaction.
async function handleTaxCodeIncrement(
  existingTaxCode:
    | {
        id: number;
        taxCode: string;
        matches: number;
      }
    | undefined,
  transaction: Transaction,
  transactionId: number
) {
  try {
    // Check that a non-null Tax Code was passed.
    if (existingTaxCode) {
      // Get the Transaction to Tax Code Relationships for the Transaction.
      const transactionsToTaxCodes = await db
        .select()
        .from(TransactionsToTaxCodes)
        .where(eq(TransactionsToTaxCodes.transactionId, transactionId));

      // Check to see if the Transaction has a Relationship with the Tax Code.
      const existingRelationship = transactionsToTaxCodes.find(
        (relationship) => relationship.taxCodeId === existingTaxCode.id
      );

      if (!existingRelationship) {
        // If there is no existing Relationship, Create a new one between the Transaction and Tax Codes.
        await db.insert(TransactionsToTaxCodes).values({
          transactionId: transactionId,
          taxCodeId: existingTaxCode.id,
        });
      }

      // Update the number of matches to a Transaction the Tax Code has.
      await db
        .update(TaxCode)
        .set({
          matches: existingTaxCode.matches + 1,
        })
        .where(eq(TaxCode.id, existingTaxCode.id));
    } else {
      // If there is no existing Tax Code for the Classification, create a one.
      // Number of matches is set to one, as there is one valid connection for the Tax Code (the current Transaction).
      const newTaxCode = await db
        .insert(TaxCode)
        .values({
          taxCode: transaction.taxCodeName,
          matches: 1,
        })
        .returning();

      // Set the Relationship between the Transaction and new Tax Code.
      await db.insert(TransactionsToTaxCodes).values({
        transactionId: transactionId,
        taxCodeId: newTaxCode[0].id,
      });
    }
  } catch (error) {
    // Catch any errors and return an error response, include the error message if it is present.
    if (error instanceof Error) {
      console.error(
        'Error Incremeting Count Of Transaction Tax Codes: ' + error.message
      );
    } else {
      console.error('Unexpected Error Count Of Transaction Tax Codes.');
    }
  }
}
