'use server';

import { db } from '@/db/index';
import {
  ForReviewTransaction as DatabaseForReviewTransaction,
  Category,
  ForReviewTransactionToCategories,
  TaxCode,
  ForReviewTransactionToTaxCodes,
} from '@/db/schema';

import type {
  ClassifiedElement,
  ClassifiedForReviewTransaction,
  RawForReviewTransaction,
  QueryResult,
} from '@/types/index';

// Takes: A realm Id and an array of 'For Review' transaction Sub-arrays in format [ClassifiedForReviewTransaction, ForReviewTransaction].
// Returns: A Query Result for saving the 'For Review' transactions.
export async function addDatabaseForReviewTransactions(
  transactions: (ClassifiedForReviewTransaction | RawForReviewTransaction)[][],
  realmId: string
): Promise<QueryResult> {
  try {
    // Iterate through the passed 'For Review' transactions.
    for (const transaction of transactions) {
      // Extract and define the types of the ClassifiedForReviewTransaction and  Raw 'For Review' transaction.
      const classifiedTransaction =
        transaction[0] as ClassifiedForReviewTransaction;
      const rawTransaction = transaction[1] as RawForReviewTransaction;

      // Find the Classification type of the predictions in the the Classified 'For Review' transaction.
      const [categoryPredictionType, taxCodePredictionType] =
        getClassificationType(classifiedTransaction);

      // Define the object to save, contains the values needed for the Review Table and for writing to QuickBooks.
      const databaseObject = {
        companyId: realmId,
        reviewTransactionId: classifiedTransaction.transaction_Id,
        accountId: classifiedTransaction.account,
        accountName: classifiedTransaction.accountName,
        description: rawTransaction.description,
        origDescription: rawTransaction.origDescription,
        date: rawTransaction.olbTxnDate,
        amount: Number(classifiedTransaction.amount).toFixed(2),
        acceptType: rawTransaction.acceptType,
        payeeNameId: rawTransaction.addAsQboTxn.nameId
          ? rawTransaction.addAsQboTxn.nameId
          : null,
        transactionTypeId: rawTransaction.addAsQboTxn.txnTypeId,
        topCategoryClassification: categoryPredictionType,
        topTaxCodeClassification: taxCodePredictionType,
      };

      // Save the new 'For Review' transaction.
      const databaseForReviewTransaction = await db
        .insert(DatabaseForReviewTransaction)
        .values(databaseObject)
        .returning();

      // Define trackers for the results of the connecting the 'For Review' transaction to its Classifications.
      let categoryConnectionResult = '';
      let taxCodeConnectionResult = '';

      // Check if the Classification is present, then call a helper functions to save the related Classificaions.
      if (classifiedTransaction.categories) {
        categoryConnectionResult = await handleCategoryConnections(
          classifiedTransaction.categories,
          databaseForReviewTransaction[0].id
        );
      }
      if (classifiedTransaction.taxCodes) {
        taxCodeConnectionResult = await handleTaxCodeConnections(
          classifiedTransaction.taxCodes,
          databaseForReviewTransaction[0].id
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
        detail: 'Unexpected Error Occurred.',
      };
    }
  }
}

// Takes: A Classified 'For Review' transaction.
// Returns: An array of the Classificaion methods. Format: [categoryConfidence, taxCodeConfidence].
function getClassificationType(
  classifiedTransaction: ClassifiedForReviewTransaction
): [string, string] {
  // Define a value to track the method for each Classification type.
  let categoryPredictionType = 'None';
  let taxCodePredictionType = 'None';

  // Check the Classificaion is persent and extract the Classification method from the first Classification.
  if (classifiedTransaction.categories && classifiedTransaction.categories[0]) {
    categoryPredictionType = classifiedTransaction.categories[0].classifiedBy;
  }
  if (classifiedTransaction.taxCodes && classifiedTransaction.taxCodes[0]) {
    taxCodePredictionType = classifiedTransaction.taxCodes[0].classifiedBy;
  }

  // Return the Classification methods.
  return [categoryPredictionType, taxCodePredictionType];
}

// Takes: The Classified Elements for the Category Classifications.
// Returns: A string with a 'Success' or 'Error' message.
async function handleCategoryConnections(
  newTransactionCategories: ClassifiedElement[],
  transactionId: string
): Promise<string> {
  try {
    // Get the existing Categories.
    const existingCategories = await db.select().from(Category);

    // Check all Category Classified Elements connected to the 'For Review' transaction.
    for (const category of newTransactionCategories) {
      // Check if a related Category already exists for the current Classified Element.
      const matchingCategory = existingCategories.find(
        (dbCategory) => dbCategory.category === category.name
      );

      // Make a variable to track the Id of the current Category, used in updating the Relationships.
      let categoryId;

      // If the Category does not exist, create a new one.
      if (!matchingCategory) {
        // Number of matches is set to 0, as no 'For Review' transactions have been saved with this Category yet.
        const newForReviewCategory = await db
          .insert(Category)
          .values({
            category: category.name,
            matches: 0,
          })
          .returning();

        // Record the Id of the Category for Relationship updating.
        categoryId = newForReviewCategory[0].id;
      } else {
        categoryId = matchingCategory.id;
      }

      // Create a new Relationship using the recorded Category Id and passed Transaction Id
      await db.insert(ForReviewTransactionToCategories).values({
        reviewTransactionId: transactionId,
        categoryId: categoryId,
      });
    }
    // Return a string indicating success.
    return 'Success';
  } catch (error) {
    // Catch any errors and log an error, include the error message if it is present.
    if (error instanceof Error && error.message) {
      console.error(
        'Error Creating Category Connection For The Transaction: ' +
          error.message
      );
    } else {
      console.error(
        'Unexpected Error Creating Category Connection For The Transaction.'
      );
    }
    // Return a string indicating an error was encountered.
    return 'Error';
  }
}

// Takes: The Classified Elements for the Tax Code Classifications.
// Returns: A string with a 'Success' or 'Error' message.
async function handleTaxCodeConnections(
  newTransactionTaxCodes: ClassifiedElement[],
  transactionId: string
): Promise<string> {
  try {
    // Get the existing Tax Codes.
    const existingTaxCodes = await db.select().from(TaxCode);

    // Check all Tax Code Classified Elements connected to the 'For Review' transaction.
    for (const taxCode of newTransactionTaxCodes) {
      // Check if a related Tax Code already exists for the current Tax Code Classified Element.
      const matchingTaxCode = existingTaxCodes.find(
        (dbTaxCode) => dbTaxCode.taxCode === taxCode.name
      );

      // Make a variable to track the Id of the current Tax Code, used in updating the Relationships.
      let taxCodeId;

      // If the Tax Code does not exist, create a new one.
      if (!matchingTaxCode) {
        // Number of matches is set to 0, as no 'For Review' transactions have been saved with this Tax Code yet.
        const newForReviewTaxCode = await db
          .insert(TaxCode)
          .values({
            taxCode: taxCode.name,
            matches: 0,
          })
          .returning();

        // Record the Id of the Tax Code for Relationship updating.
        taxCodeId = newForReviewTaxCode[0].id;
      } else {
        taxCodeId = matchingTaxCode.id;
      }

      // Create a new Relationship using the recorded Category Id and passed Transaction Id
      await db.insert(ForReviewTransactionToTaxCodes).values({
        reviewTransactionId: transactionId,
        taxCodeId: taxCodeId,
      });
    }
    // Return a string indicating success.
    return 'Success';
  } catch (error) {
    // Catch any errors and log an error, include the error message if it is present.
    if (error instanceof Error && error.message) {
      console.error(
        'Error Creating Tax Code Connection For The Transaction: ' +
          error.message
      );
    } else {
      console.error(
        'Unexpected Error Creating Tax Code Connection For The Transaction.'
      );
    }
    // Return a string indicating an error was encountered.
    return 'Error';
  }
}
