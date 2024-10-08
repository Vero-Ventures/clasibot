'use server';
import { db } from '@/db/index';
import {
  ForReviewTransaction as DatabaseForReviewTransaction,
  ForReviewTransactionToCategories,
  ForReviewTransactionToTaxCodes,
  Category,
  TaxCode,
} from '@/db/schema';
import type { ClassifiedElement } from '@/types/Classification';
import type {
  ForReviewTransaction,
  ClassifiedForReviewTransaction,
} from '@/types/ForReviewTransaction';
import type { QueryResult } from '@/types/QueryResult';
import { eq } from 'drizzle-orm';

export async function addForReviewTransactions(
  transactions: (ForReviewTransaction | ClassifiedForReviewTransaction)[][],
  companyId: string
): Promise<QueryResult> {
  try {
    for (const transaction of transactions) {
      // Define the type of the 'for review' transaction being saved.
      const classifiedTransaction =
        transaction[0] as ClassifiedForReviewTransaction;

      const [categoryConfidence, taxCodeConfidence] = findConfidenceLevels(
        classifiedTransaction
      );

      // Define the type of the raw for review transaction with key data for later QBO updates.
      const rawTransaction = transaction[0] as ForReviewTransaction;

      // Check if this transaction has already been saved into the database.
      // Checks for transactions where the company ID and transaction ID match the current company and the ID of the current transaction.
      const matchingTransactions = await db
        .select()
        .from(DatabaseForReviewTransaction)
        .where(
          eq(DatabaseForReviewTransaction.companyId, companyId) &&
            eq(
              DatabaseForReviewTransaction.transactionId,
              classifiedTransaction.transaction_ID
            )
        );

      // If no matching transaction is found continue addition to the database.
      if (matchingTransactions.length === 0) {
        // Define the object to save to the database.
        const databaseObject = {
          companyId: companyId,
          transactionId: classifiedTransaction.transaction_ID,
          accountId: classifiedTransaction.account,
          accountName: classifiedTransaction.accountName,
          description: rawTransaction.description,
          origDescription: rawTransaction.origDescription,
          date: rawTransaction.olbTxnDate,
          amount: classifiedTransaction.amount,
          acceptType: rawTransaction.acceptType,
          payeeNameId: rawTransaction.addAsQboTxn.nameId,
          transactionTypeId: rawTransaction.addAsQboTxn.txnTypeId,
          topCategoryClassification: categoryConfidence,
          topTaxCodeClassification: taxCodeConfidence,
          approved: false,
        };

        // Create the new transaction in the database using the defined values.
        const newTransaction = await db
          .insert(DatabaseForReviewTransaction)
          .values(databaseObject)
          .returning();

        // Create variables to track results of the classification connection methods.
        let categoryConnectionResult = '';
        let taxCodeConnectionResult = '';

        // Check if category classifications are present.
        // If they are, call a method to add connection to categorizations where needed.
        if (classifiedTransaction.categories) {
          categoryConnectionResult = await handleCategoryConnections(
            newTransaction[0].id,
            classifiedTransaction.categories
          );
        }

        // If a category connection failed, log the error.
        if (categoryConnectionResult !== 'Success') {
          console.error(categoryConnectionResult);
        }

        // Preform the same process for the transactions tax codes.
        if (classifiedTransaction.taxCodes) {
          taxCodeConnectionResult = await handleTaxCodeConnections(
            newTransaction[0].id,
            classifiedTransaction.taxCodes
          );
        }

        // If a tax code connection failed, log the error.
        if (taxCodeConnectionResult !== 'Success') {
          console.error(taxCodeConnectionResult);
        }
      }
    }
    return {
      result: 'Success',
      message: 'Adding "For Review" transactions to database was successful.',
      detail:
        '"For Review" transactions and their connections successfully added to the database.',
    };
  } catch (error) {
    // Catch any errors, return the message if there is one, otherwise return a custom error message.
    if (error instanceof Error && error.message) {
      return {
        result: 'Error',
        message:
          'An error was encountered adding a "For Review" transaction or one of its connections.',
        detail: error.message,
      };
    } else {
      return {
        result: 'Error',
        message:
          'An error was encountered adding a "For Review" transaction or one of its connections.',
        detail: 'Unknown error encountered.',
      };
    }
  }
}

// Finds the confidence level of each classification for a transaction.
function findConfidenceLevels(
  classifiedTransaction: ClassifiedForReviewTransaction
): [string, string] {
  // Define a value to track the most confident classification method for each type.
  let categoryConfidence = 'None';
  let taxCodeConfidence = 'None';

  // If categories are present for the classified transaction, first recorded value will have highest confidence level.
  if (classifiedTransaction.categories) {
    categoryConfidence = classifiedTransaction.categories[0].classifiedBy;
  }

  // If tax codes are present for the classified transaction, first recorded value will have highest confidence level.
  if (classifiedTransaction.taxCodes) {
    taxCodeConfidence = classifiedTransaction.taxCodes[0].classifiedBy;
  }
  return [categoryConfidence, taxCodeConfidence];
}

async function handleCategoryConnections(
  newTransactionId: string,
  newTransactionCategories: ClassifiedElement[]
): Promise<string> {
  try {
    // Get the existing categories to check against the transactions classifications.
    // Needed if LLM prediction for basic category type.
    const existingCategories = await db.select().from(Category);

    // Iterate through the passed categories.
    for (const category of newTransactionCategories) {
      // Check if the category already exists.
      const existingCategory = existingCategories.find(
        (dbCategory) => dbCategory.category === category.name
      );

      // Create a value to store either the found category ID or the new category ID.
      let databaseCategoryId = 0;

      // If the category does not exist, create it in the database.
      if (!existingCategory) {
        // Count is set to 0, as no confirmed classification for this category exists yet.
        // If the user chooses to save with this categorization, count will be incremented in review page save function.
        const newCategory = await db
          .insert(Category)
          .values({
            category: category.name,
            count: 0,
          })
          .returning();

        // Store the ID of the new category.
        databaseCategoryId = newCategory[0].id;
      } else {
        // If the category already exists, save its ID.
        databaseCategoryId = existingCategory.id;
      }

      // Create the connection between the category and transaction.
      await db.insert(ForReviewTransactionToCategories).values({
        transactionId: newTransactionId,
        categoryId: databaseCategoryId,
      });
    }
    return 'Success';
  } catch (error) {
    // Catch any errors, return the message if there is one, otherwise return a custom error message.
    if (error instanceof Error && error.message) {
      return error.message;
    } else {
      return 'Error, creating the category connection for a transaction failed';
    }
  }
}

async function handleTaxCodeConnections(
  newTransactionId: string,
  newTransactionTaxCodes: ClassifiedElement[]
): Promise<string> {
  try {
    // Get the existing tax codes to check against the transactions classifications.
    // Needed if LLM prediction for the tax code type.
    const existingTaxCodes = await db.select().from(TaxCode);

    // Iterate through the passed tax codes.
    for (const taxCode of newTransactionTaxCodes) {
      // Check if the tax code already exists.
      const existingTaxCode = existingTaxCodes.find(
        (dbTaxCode) => dbTaxCode.taxCode === taxCode.name
      );

      // Create a value to store either the found tax code ID or the new tax code ID.
      let databaseTaxCodeId = 0;

      // If the tax code does not exist, create it in the database.
      if (!existingTaxCode) {
        // Count is set to 0, as no confirmed classification for this tax code exists yet.
        // If the user chooses to save with this categorization, count will be incremented in review page save function.
        const newTaxCode = await db
          .insert(TaxCode)
          .values({
            taxCode: taxCode.name,
            count: 0,
          })
          .returning();

        // Store the ID of the new tax code.
        databaseTaxCodeId = newTaxCode[0].id;
      } else {
        // If the tax code already exists, save its ID.
        databaseTaxCodeId = existingTaxCode.id;
      }

      // Create the connection between the tax code and transaction.
      await db.insert(ForReviewTransactionToTaxCodes).values({
        transactionId: newTransactionId,
        taxCodeId: databaseTaxCodeId,
      });
    }
    return 'Success';
  } catch (error) {
    // Catch any errors, return the message if there is one, otherwise return a custom error message.
    if (error instanceof Error && error.message) {
      return error.message;
    } else {
      return 'Error, creating the category connection for a transaction failed';
    }
  }
}
