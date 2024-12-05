'use server';

import { db } from '@/db/index';
import {
  ForReviewTransaction as DatabaseForReviewTransaction,
  Category,
  TaxCode,
} from '@/db/schema';
import { eq } from 'drizzle-orm';

import type {
  ClassifiedElement,
  RawForReviewTransaction,
  ClassifiedForReviewTransaction,
  QueryResult,
} from '@/types/index';

// Adds newly Classified 'For Review' transactions to the database to be pulled and shown to User for review on the frontend.
// Takes: An array of 'For Review' transaction Sub-arrays in format [ClassifiedForReviewTransaction, ForReviewTransaction] as well as a Company realm Id.
// Returns: A Query Result object for adding the 'For Review' transactions to the database.
export async function addDatabaseForReviewTransactions(
  transactions: (ClassifiedForReviewTransaction | RawForReviewTransaction)[][],
  realmId: string
): Promise<QueryResult> {
  try {
    // Iterate through the passed 'For Review' transactions, extracting and defining the type of the ClassifiedForReviewTransaction.
    for (const transaction of transactions) {
      const classifiedTransaction =
        transaction[0] as ClassifiedForReviewTransaction;

      // Find the Classification type of the predictions in the the Classified 'For Review' transaction.
      const [categoryPredictionType, taxCodePredictionType] =
        getClassificationType(classifiedTransaction);

      // Extract and define the type of the Raw 'For Review' transaction which contains data for writing to QuickBooks.
      const rawTransaction = transaction[0] as RawForReviewTransaction;

      // Check if the current 'For Review' transaction has already been saved into the database.
      // Compares the Company realm Id and 'For Review' transaction Id which is a unique combination (Transaction Id's are unique by Company).
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
          payeeNameId: rawTransaction.addAsQboTxn.nameId
            ? rawTransaction.addAsQboTxn.nameId
            : null,
          transactionTypeId: rawTransaction.addAsQboTxn.txnTypeId,
          topCategoryClassification: categoryPredictionType,
          topTaxCodeClassification: taxCodePredictionType,
        };

        // Write the new 'For Review' transaction to the database.
        await db.insert(DatabaseForReviewTransaction).values(databaseObject);

        // Create variables to track results of the connecting the 'For Review' transaction to its related database Classification objects.
        let categoryConnectionResult = '';
        let taxCodeConnectionResult = '';

        // Check if Category and Tax Code Classifications are present.
        // Then call helper functions to store the related Classificaions in the database.
        if (classifiedTransaction.categories) {
          categoryConnectionResult = await handleCategoryConnections(
            classifiedTransaction.categories
          );
        }
        if (classifiedTransaction.taxCodes) {
          taxCodeConnectionResult = await handleTaxCodeConnections(
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
          'An error occurred while saving newly Classified Transaction to the database.',
        detail: error.message,
      };
    } else {
      return {
        result: 'Error',
        message:
          'An error occurred while saving newly Classified Transaction to the database.',
        detail: 'Unexpected error occurred.',
      };
    }
  }
}

// Gets the Classification type of the predictions in a Classified 'For Review' transaction.
// Takes: A Classified 'For Review' transaction.
// Returns: An array of the Classificaion Types in the format [categoryConfidence, taxCodeConfidence].
function getClassificationType(
  classifiedTransaction: ClassifiedForReviewTransaction
): [string, string] {
  // Define a value to track the Classification method for each type.
  let categoryPredictionType = 'None';
  let taxCodePredictionType = 'None';

  // If a Classification is present all Classification will use the same method.
  // Extracting the Classification method of the first Classification can be used to get the confidence level.
  if (classifiedTransaction.categories && classifiedTransaction.categories[0]) {
    categoryPredictionType = classifiedTransaction.categories[0].classifiedBy;
  }
  if (classifiedTransaction.taxCodes && classifiedTransaction.taxCodes[0]) {
    taxCodePredictionType = classifiedTransaction.taxCodes[0].classifiedBy;
  }

  // Return the Confidence Value strings in an array.
  return [categoryPredictionType, taxCodePredictionType];
}

// Creates database Category objects for any new Catagories being saved to database with the Classified 'For Review' transactions.
// Takes: The Classified Element objects for the of the related Catagory Classifications.
// Returns: A string with a success or error message.
async function handleCategoryConnections(
  newTransactionCategories: ClassifiedElement[]
): Promise<string> {
  try {
    // Get the existing Categories from the database.
    const existingCategories = await db.select().from(Category);

    // Check all Category Classified Elements connected to the 'For Review' transaction.
    for (const category of newTransactionCategories) {
      // Check if a related Category already exists for the current Category Classified Element.
      const existingCategory = existingCategories.find(
        (dbCategory) => dbCategory.category === category.name
      );

      // If the Category does not exist, create a new one in the database.
      if (!existingCategory) {
        // Number of matches is set to 0, as no Classifications for this Category have been saved yet.
        // If the User saves the 'For Review' transaction with this Classification, the save function will increment the matches.
        await db.insert(Category).values({
          category: category.name,
          matches: 0,
        });
      }
    }
    // Return a string indicating success.
    return 'Success';
  } catch (error) {
    // Catch any errors and return an error string, include the error message if it is present.
    if (error instanceof Error && error.message) {
      return (
        'Error creating Category connection for the Transaction: ' +
        error.message
      );
    } else {
      return 'Error creating Category connection for the Transaction: Unexpected Error';
    }
  }
}

// Creates database Tax Code objects for any new Tax Code being saved to database with the Classified 'For Review' transactions.
// Takes: The Classified Element objects for the of the related Tax Code Classifications.
// Returns: A string with a success or error message.
async function handleTaxCodeConnections(
  newTransactionTaxCodes: ClassifiedElement[]
): Promise<string> {
  try {
    // Get the existing Tax Codes from the database.
    const existingTaxCodes = await db.select().from(TaxCode);

    // Check all Tax Code Classified Elements connected to the 'For Review' transaction.
    for (const taxCode of newTransactionTaxCodes) {
      // Check if a related Category already exists for the current Category Classified Element.
      const existingTaxCode = existingTaxCodes.find(
        (dbTaxCode) => dbTaxCode.taxCode === taxCode.name
      );

      // If the Tax Code does not exist, create a new one in the database.
      if (!existingTaxCode) {
        // Number of matches is set to 0, as no Classifications for this Tax Code have been saved yet.
        // If the User saves the 'For Review' transaction with this Classification, the save function will increment the matches.
        await db.insert(TaxCode).values({
          taxCode: taxCode.name,
          matches: 0,
        });
      }
    }
    // Return a string indicating success.
    return 'Success';
  } catch (error) {
    // Catch any errors and return an error string, include the error message if it is present.
    if (error instanceof Error && error.message) {
      return (
        'Error creating Tax Code connection for the Transaction: ' +
        error.message
      );
    } else {
      return 'Error creating Tax Code connection for the Transaction: Unexpected Error';
    }
  }
}
