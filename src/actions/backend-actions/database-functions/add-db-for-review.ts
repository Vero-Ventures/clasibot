'use server';
import { db } from '@/db/index';
import {
  ForReviewTransaction as DatabaseForReviewTransaction,
  ForReviewTransactionToCategories,
  ForReviewTransactionToTaxCodes,
  Category,
  TaxCode,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { ClassifiedElement } from '@/types/Classification';
import type {
  ForReviewTransaction,
  ClassifiedForReviewTransaction,
} from '@/types/ForReviewTransaction';
import type { QueryResult } from '@/types/QueryResult';

// Takes: An array of 'For Review' transaction Sub-arrays in format [ClassifiedForReviewTransaction, ForReviewTransaction] as well as a Company realm Id.
// Returns: A Query Result object.
export async function addForReviewTransactions(
  transactions: (ClassifiedForReviewTransaction | ForReviewTransaction)[][],
  realmId: string
): Promise<QueryResult> {
  try {
    // Iterate through the passed 'For Review' transactions, extracting and defining the type of the ClassifiedForReviewTransaction.
    for (const transaction of transactions) {
      const classifiedTransaction =
        transaction[0] as ClassifiedForReviewTransaction;

      // Find the confidence level of the predictions in the the Classified 'For Review' transaction.
      const [categoryConfidence, taxCodeConfidence] = getConfidenceLevels(
        classifiedTransaction
      );

      // Extract and define the type of the Raw 'For Review' transaction which contains data for writing to QuickBooks.
      const rawTransaction = transaction[0] as ForReviewTransaction;

      // Check if the current 'For Review' transaction has already been saved into the database.
      // Compares the Company realm Id and transaction Id which is a unique combination (transaction Id's are unique by Company).
      const matchingTransactions = await db
        .select()
        .from(DatabaseForReviewTransaction)
        .where(
          eq(DatabaseForReviewTransaction.companyId, realmId) &&
            eq(
              DatabaseForReviewTransaction.reviewTransactionId,
              classifiedTransaction.transaction_Id
            )
        );

      // If no database match was found, continue to save the 'For Review' transaction to the database.
      if (matchingTransactions.length === 0) {
        // Define the object to save to the database.
        // Contains the values needed for frontend display and for writing to QuickBooks.
        const databaseObject = {
          companyId: realmId,
          reviewTransactionId: classifiedTransaction.transaction_Id,
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
        };

        // Write the new 'For Review' transaction to the database.
        const newTransaction = await db
          .insert(DatabaseForReviewTransaction)
          .values(databaseObject)
          .returning();

        // Create variables to track results of the connecting the 'For Review' transaction to its related database Classification objects.
        let categoryConnectionResult = '';
        let taxCodeConnectionResult = '';

        // Check if Category and Tax Code Classifications are present.
        // Then call helper functions to connect the 'For Review' transaction to the Classificaions in the database.
        if (classifiedTransaction.categories) {
          categoryConnectionResult = await handleCategoryConnections(
            newTransaction[0].id,
            classifiedTransaction.categories
          );
        }
        if (classifiedTransaction.taxCodes) {
          taxCodeConnectionResult = await handleTaxCodeConnections(
            newTransaction[0].id,
            classifiedTransaction.taxCodes
          );
        }

        // Check if theCategory or Tax Code connection resulted in an error and log the errors.
        if (categoryConnectionResult === 'Error') {
          console.error(categoryConnectionResult);
        }
        if (taxCodeConnectionResult === 'Error') {
          console.error(taxCodeConnectionResult);
        }
      }
    }
    // Once all 'For Review' transactions have been handled, return a success Query Result.
    return {
      result: 'Success',
      message: 'Adding "For Review" transactions to database was successful.',
      detail:
        '"For Review" transactions and their connections successfully added to the database.',
    };
  } catch (error) {
    // Catch any errors and return an error Query Result, include the error message if it is present.
    if (error instanceof Error && error.message) {
      return {
        result: 'Error',
        message:
          'An error occurred while saving newly classified transaction to the database.',
        detail: error.message,
      };
    } else {
      return {
        result: 'Error',
        message:
          'An error occurred while saving newly classified transaction to the database.',
        detail: 'Unexpected error occurred.',
      };
    }
  }
}

// Takes: A Classified 'For Review' transaction and uses its Classification methods to produce Confidence Values.
// Returns: An array of the Confidence Values in the format [categoryConfidence, taxCodeConfidence].
function getConfidenceLevels(
  classifiedTransaction: ClassifiedForReviewTransaction
): [string, string] {
  // Define a value to track the Classification method for each type.
  let categoryConfidence = 'None';
  let taxCodeConfidence = 'None';

  // If a Classification is present all Classification will use the same method.
  // Extracting the Classification method of the first Classification can be used to get the confidence level.
  if (classifiedTransaction.categories) {
    categoryConfidence = classifiedTransaction.categories[0].classifiedBy;
  }
  if (classifiedTransaction.taxCodes) {
    taxCodeConfidence = classifiedTransaction.taxCodes[0].classifiedBy;
  }

  // Return the Confidence Value strings in an array.
  return [categoryConfidence, taxCodeConfidence];
}

// Takes the Id of a new database 'For Review' transaction, as well as its related Catagory Classifications.
// Returns: A string inidicating success or an error.
async function handleCategoryConnections(
  newTransactionId: string,
  newTransactionCategories: ClassifiedElement[]
): Promise<string> {
  try {
    // Get the existing Categories from the database.
    const existingCategories = await db.select().from(Category);

    // Check all Category Classified Elements connected to the 'For Review' transaction.
    for (const category of newTransactionCategories) {
      // Check if a related Category already exists.
      const existingCategory = existingCategories.find(
        (dbCategory) => dbCategory.category === category.name
      );

      // Create a value to store the found Category Id or the Id of a newly created Category.
      let databaseCategoryId = 0;

      // If the Category does not exist, create a new one in the database.
      if (!existingCategory) {
        // Number of matches is set to 0, as no Classifications for this Category have been saved yet.
        // If the User saves the 'For Review' transaction with this Classification, the save function will increment the matches.
        const newCategory = await db
          .insert(Category)
          .values({
            category: category.name,
            matches: 0,
          })
          .returning();

        // Store the Id of the newly created Category.
        databaseCategoryId = newCategory[0].id;
      } else {
        // If the Category already exists, store its Id.
        databaseCategoryId = existingCategory.id;
      }

      // Define the Relationship between the database 'For Review' transaction object and the related database Category object.
      await db.insert(ForReviewTransactionToCategories).values({
        reviewTransactionId: newTransactionId,
        categoryId: databaseCategoryId,
      });
    }
    // Return a string indicating success.
    return 'Success';
  } catch (error) {
    // Catch any errors and return an error string, include the error message if it is present.
    if (error instanceof Error && error.message) {
      return (
        'Error creating category connection for the transaction: ' +
        error.message
      );
    } else {
      return 'Error creating category connection for the transaction: Unexpected Error';
    }
  }
}

// Takes the Id of a new database 'For Review' transaction, as well as its related Tax Code CAlassifications.
// Returns: A string inidicating success or an error.
async function handleTaxCodeConnections(
  newTransactionId: string,
  newTransactionTaxCodes: ClassifiedElement[]
): Promise<string> {
  try {
    // Get the existing Tax Codes from the database.
    const existingTaxCodes = await db.select().from(TaxCode);

    // Check all Tax Code Classified Elements connected to the 'For Review' transaction.
    for (const taxCode of newTransactionTaxCodes) {
      // Check if a related Tax Code already exists.
      const existingTaxCode = existingTaxCodes.find(
        (dbTaxCode) => dbTaxCode.taxCode === taxCode.name
      );

      // Create a value to store the found Tax Code Id or the Id of a newly created Tax Code.
      let databaseTaxCodeId = 0;

      // If the Tax Code does not exist, create a new one in the database.
      if (!existingTaxCode) {
        // Number of matches is set to 0, as no Classifications for this Tax Code have been saved yet.
        // If the User saves the 'For Review' transaction with this Classification, the save function will increment the matches.
        const newTaxCode = await db
          .insert(TaxCode)
          .values({
            taxCode: taxCode.name,
            matches: 0,
          })
          .returning();

        // Store the Id of the newly created Tax Code.
        databaseTaxCodeId = newTaxCode[0].id;
      } else {
        // If the Tax Code already exists, save its Id.
        databaseTaxCodeId = existingTaxCode.id;
      }

      // Define the Relationship between the database 'For Review' transaction object and the related database Tax Code object.
      await db.insert(ForReviewTransactionToTaxCodes).values({
        reviewTransactionId: newTransactionId,
        taxCodeId: databaseTaxCodeId,
      });
    }
    // Return a string indicating success.
    return 'Success';
  } catch (error) {
    // Catch any errors and return an error string, include the error message if it is present.
    if (error instanceof Error && error.message) {
      return (
        'Error creating tax code connection for the transaction: ' +
        error.message
      );
    } else {
      return 'Error creating tax code connection for the transaction: Unexpected Error';
    }
  }
}
