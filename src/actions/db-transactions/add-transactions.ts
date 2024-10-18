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
import type { QueryResult } from '@/types/QueryResult';
import type { Transaction } from '@/types/Transaction';

// Takes an array of saved user transactions and saves them to the database for future classification use.
// Returns: A Query Result object.
export async function addTransactions(
  transactions: Transaction[]
): Promise<QueryResult> {
  try {
    for (const transaction of transactions) {
      // Make a variable to track the Id of the current transaction.
      // The Id is used to update the relationship tables.
      let transactionID = 0;

      // Check for any existing transactions with the same name as the current transaction.
      const existingTransaction = await db
        .select()
        .from(DrizzleTransaction)
        .where(eq(DrizzleTransaction.transactionName, transaction.name));

      // Check if there is no existing transaction.
      if (!existingTransaction[0]) {
        // Create a new transaction with the transaction name.
        const newTransaction = await db
          .insert(DrizzleTransaction)
          .values({
            transactionName: transaction.name,
          })
          .returning();

        // Record the Id of the new transaction.
        transactionID = newTransaction[0].id;
      } else {
        // If an existing transaction is found, record the Id.
        transactionID = existingTransaction[0].id;
      }

      // Create an array of all categories and tax codes present in the database.
      const categories = await db.select().from(Category);
      const taxCodes = await db.select().from(TaxCode);

      // Check the existing classifications for ones that the classifications of the current transaction.
      const existingCategory = categories.find(
        (category) => category.category === transaction.category
      );
      const existingTaxCode = taxCodes.find(
        (taxCode) => taxCode.taxCode === transaction.taxCodeName
      );

      // Call helper methods to handle creating or updating the classifications and relationships for the transaction.
      handleCategoryIncrement(existingCategory, transaction, transactionID);
      handleTaxCodeIncrement(existingTaxCode, transaction, transactionID);
    }

    // Return a success Query Response.
    return {
      result: 'Success',
      message: 'Transactions Were Saved To Database',
      detail: 'The Classified Saved User Transactions Were Saved Successfully',
    };

    // Catch any errors and return an error Query Response with the error message if it is present.
  } catch (error) {
    if (error instanceof Error) {
      return {
        result: 'Error',
        message: 'An Unexpected Error Occured',
        detail: error.message,
      };
    } else {
      return {
        result: 'Error',
        message: 'An Unexpected Error Occured',
        detail: 'N/A',
      };
    }
  }
}

// Based on if an existing category exists, either increments the number of matches for that category or makes a new category object with 1 match.
// Takes an existing category with an ID, category name, and number of matches.
// Also takes the transaction being saved and the Id of its database object.
async function handleCategoryIncrement(
  existingCategory:
    | {
        id: number;
        category: string;
        matches: number;
      }
    | undefined,
  transaction: Transaction,
  transactionID: number
) {
  try {
    // Check that a non-null category was passed.
    if (existingCategory) {
      // Get the transaction to category relationships for the transaction.
      const transactionCategories = await db
        .select()
        .from(TransactionsToCategories)
        .where(eq(TransactionsToCategories.transactionId, transactionID));

      // Check the relationships to see if the transaction is already connected to the category object.
      const existingRelationship = transactionCategories.find(
        (relationship) => relationship.categoryId === existingCategory.id
      );

      if (!existingRelationship) {
        // If there is no relationship, Create a new one between the transaction and category objects.
        await db.insert(TransactionsToCategories).values({
          transactionId: transactionID,
          categoryId: existingCategory.id,
        });
      }

      // Update the number of matches to a transaction.
      await db
        .update(Category)
        .set({
          matches: existingCategory.matches + 1,
        })
        .where(eq(Category.id, existingCategory.id));
    } else {
      // If there is no existing category object for the classification, create a new category object.
      // Number of matches is set to one, as there is one valid connection for the category (the current transaction).
      const newCategory = await db
        .insert(Category)
        .values({
          category: transaction.category,
          matches: 1,
        })
        .returning();

      // Define a relationship between the transaction and new category object.
      await db.insert(TransactionsToCategories).values({
        transactionId: transactionID,
        categoryId: newCategory[0].id,
      });
    }
  } catch (error) {
    // Catch any errors and return an error response with the error message if it is present.
    if (error instanceof Error) {
      console.error('Error: ' + error.message);
    } else {
      console.error('Unexpected Error.');
    }
  }
}

// Based on if an existing tax code exists, either increments the number of matches or makes a new tax code obejct with 1 match.
// Takes an existing tax code with an ID, category name, and number of matches.
// Also takes the transaction being saved and the Id of its database object.
async function handleTaxCodeIncrement(
  existingTaxCode:
    | {
        id: number;
        taxCode: string;
        matches: number;
      }
    | undefined,
  transaction: Transaction,
  transactionID: number
) {
  try {
    // Check that a non-null tax code was passed.
    if (existingTaxCode) {
      // Get the transaction to tax codes relationships for the transaction.
      const transactionsToTaxCodes = await db
        .select()
        .from(TransactionsToTaxCodes)
        .where(eq(TransactionsToTaxCodes.transactionId, transactionID));

      // Check the relationships to see if the transaction is already connected to the tax code object.
      const existingRelationship = transactionsToTaxCodes.find(
        (relationship) => relationship.taxCodeId === existingTaxCode.id
      );

      if (!existingRelationship) {
        // If there is no relationship, Create a new one between the transaction and tax code objects.
        await db.insert(TransactionsToCategories).values({
          transactionId: transactionID,
          categoryId: existingTaxCode.id,
        });
      }

      // Update the number of matches to a transaction.
      await db
        .update(TaxCode)
        .set({
          matches: existingTaxCode.matches + 1,
        })
        .where(eq(Category.id, existingTaxCode.id));
    } else {
      // If there is no existing tax code object for the classification, create a new tax code object.
      // Number of matches is set to one, as there is one valid connection for the tax code (the current transaction).
      const newTaxCode = await db
        .insert(TaxCode)
        .values({
          taxCode: transaction.taxCodeName,
          matches: 1,
        })
        .returning();

      // Define a relationship between the transaction and new tax code object.
      await db.insert(TransactionsToTaxCodes).values({
        transactionId: transactionID,
        taxCodeId: newTaxCode[0].id,
      });
    }
  } catch (error) {
    // Catch any errors and return an error response with the error message if it is present.
    if (error instanceof Error) {
      console.error('Error: ' + error.message);
    } else {
      console.error('Unexpected Error.');
    }
  }
}
