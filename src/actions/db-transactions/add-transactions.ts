'use server';
import { db } from '@/db/index';
import {
  Transaction as DrizzleTransaction,
  TransactionsToCategories,
  Category,
  TaxCode,
  TransactionsToTaxCodes,
} from '@/db/schema';
import type { Transaction } from '@/types/Transaction';
import { eq } from 'drizzle-orm';

export async function addTransactions(
  transactions: Transaction[]
): Promise<void> {
  for (const transaction of transactions) {
    try {
      // Make a variable to track the transaction ID used to update the relationship tables.
      let transactionID = 0;

      // Check for an existing transaction with the same name as the current transaction.
      const existingTransaction = await db
        .select()
        .from(DrizzleTransaction)
        .where(eq(DrizzleTransaction.transactionName, transaction.name));

      // Check if there is an existing transaction.
      if (!existingTransaction[0]) {
        // Create a new transaction with the transaction name.
        const newTransaction = await db
          .insert(DrizzleTransaction)
          .values({
            transactionName: transaction.name,
          })
          .returning();

        // Set the transaction ID to the ID of the new transaction.
        transactionID = newTransaction[0].id;
      } else {
        // If an existing transaction is found, set the transaction ID to the ID of the existing transaction.
        transactionID = existingTransaction[0].id;
      }

      // Create an array of all categories in the database.
      const categories = await db.select().from(Category);

      // Check through array of categories to see if the transactions category already exists.
      const existingCategory = categories.find(
        (category) => category.category === transaction.category
      );

      // Create an array of all tax codes in the database.
      const taxCodes = await db.select().from(TaxCode);

      // Check through array of categories to see if the transactions category already exists.
      const existingTaxCode = taxCodes.find(
        (taxCode) => taxCode.taxCode === transaction.taxCodeName
      );

      // Call method to handle creating or updating the categories for the transaction.
      handleCategoryIncrement(existingCategory, transaction, transactionID);

      // Call method to handle creating or updating the tax code for the transaction.
      handleTaxCodeIncrement(existingTaxCode, transaction, transactionID);
    } catch (error) {
      // Catch and log any errors that occur during the transaction addition process.
      console.error('Error adding transaction:', error);
      throw error;
    }
  }
}

// Based on if an existing category exists, either increments that category or makes a new category with count 1.
async function handleCategoryIncrement(
  existingCategory:
    | {
        id: number;
        category: string;
        count: number;
      }
    | undefined,
  transaction: Transaction,
  transactionID: number
) {
  // Create or update the categorization for the transaction.
  if (existingCategory) {
    // Get the transaction to categorization relations for the transaction.
    const transactionCategories = await db
      .select()
      .from(TransactionsToCategories)
      .where(eq(TransactionsToCategories.transactionId, transactionID));

    // Check the relationship table to see if the transaction is already linked to the category.
    const existingRelationship = transactionCategories.find(
      (relationship) => relationship.categoryId === existingCategory.id
    );

    if (!existingRelationship) {
      // If there is no relationship, Create a new one between the transaction and category.
      await db.insert(TransactionsToCategories).values({
        transactionId: transactionID,
        categoryId: existingCategory.id,
      });
    }

    // Update the count for the number of times the category has been used.
    await db
      .update(Category)
      .set({
        count: existingCategory.count + 1,
      })
      .where(eq(Category.id, existingCategory.id));
  } else {
    // If the category doesn't exist, create a new category with a count of 1.
    const newCategory = await db
      .insert(Category)
      .values({
        category: transaction.category,
        count: 1,
      })
      .returning();

    // Create a relationship between the transaction and new category.
    await db.insert(TransactionsToCategories).values({
      transactionId: transactionID,
      categoryId: newCategory[0].id,
    });
  }
}

// Based on if an existing tax code exists, either increments that tax code or makes a new tax code with count 1.
async function handleTaxCodeIncrement(
  existingTaxCode:
    | {
        id: number;
        taxCode: string;
        count: number;
      }
    | undefined,
  transaction: Transaction,
  transactionID: number
) {
  if (existingTaxCode) {
    // Get the transaction to tax code relations for the transaction.
    const transactionsToTaxCodes = await db
      .select()
      .from(TransactionsToTaxCodes)
      .where(eq(TransactionsToTaxCodes.transactionId, transactionID));

    // Check the relationship table to see if the transaction is already linked to the tax code.
    const existingRelationship = transactionsToTaxCodes.find(
      (relationship) => relationship.taxCodeId === existingTaxCode.id
    );

    if (!existingRelationship) {
      // If there is no relationship, Create a new one between the transaction and tax code.
      await db.insert(TransactionsToCategories).values({
        transactionId: transactionID,
        categoryId: existingTaxCode.id,
      });
    }

    // Update the count for the number of times the tax code has been used.
    await db
      .update(TaxCode)
      .set({
        count: existingTaxCode.count + 1,
      })
      .where(eq(Category.id, existingTaxCode.id));
  } else {
    // If the category doesn't exist, create a new tax code with a count of 1.
    const newTaxCode = await db
      .insert(TaxCode)
      .values({
        taxCode: transaction.taxCodeName,
        count: 1,
      })
      .returning();

    // Create a relationship between the transaction and new tax code.
    await db.insert(TransactionsToTaxCodes).values({
      transactionId: transactionID,
      taxCodeId: newTaxCode[0].id,
    });
  }
}
