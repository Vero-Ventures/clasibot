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

// Takes an array of 'For Review' transaction sub arrays in format [ClassifiedForReviewTransaction, ForReviewTransaction] as well as a companies realmId.
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

      // Takes the classified 'For Review' transaction and finds the confidence levels assosiated with its predictions.
      const [categoryConfidence, taxCodeConfidence] = getConfidenceLevels(
        classifiedTransaction
      );

      // Extract and define the type of the raw 'For Review' transaction, contains data needed for writing to QuickBooks later.
      const rawTransaction = transaction[0] as ForReviewTransaction;

      // Check if the current 'For Review' transaction has already been saved into the database.
      // Checks by comparing the realm Id and transaction Id which makes a unique combination (transaction Id's are unique by company).
      const matchingTransactions = await db
        .select()
        .from(DatabaseForReviewTransaction)
        .where(
          eq(DatabaseForReviewTransaction.companyId, realmId) &&
            eq(
              DatabaseForReviewTransaction.transactionId,
              classifiedTransaction.transaction_ID
            )
        );

      // If no database match was found continue to save the transaction to the database.
      if (matchingTransactions.length === 0) {
        // Define the object to save to the database.
        // Contains the values needed for frontend display, along with the raw data needed for writing to QuickBooks.
        const databaseObject = {
          companyId: realmId,
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
        };

        // Write the new 'For Review' transaction to the database.
        const newTransaction = await db
          .insert(DatabaseForReviewTransaction)
          .values(databaseObject)
          .returning();

        // Create variables to track results of the connecting the 'For Review' transaction to its related classification database objects.
        let categoryConnectionResult = '';
        let taxCodeConnectionResult = '';

        // Check if category classifications are present and call helper function to connect the transaction to the catagories in the database.
        if (classifiedTransaction.categories) {
          categoryConnectionResult = await handleCategoryConnections(
            newTransaction[0].id,
            classifiedTransaction.categories
          );
        }

        // Preform the same process for the transactions tax codes.
        if (classifiedTransaction.taxCodes) {
          taxCodeConnectionResult = await handleTaxCodeConnections(
            newTransaction[0].id,
            classifiedTransaction.taxCodes
          );
        }

        // If a category or tax code connection failed, log the error.
        if (categoryConnectionResult !== 'Success') {
          console.error(categoryConnectionResult);
        }
        if (taxCodeConnectionResult !== 'Success') {
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

// Takes a classifiedForReviewTransactions and extracts its classification methods and uses that to produce confidence values.
// Returns an array of the confidence values in the format [categoryConfidence, taxCodeConfidence].
function getConfidenceLevels(
  classifiedTransaction: ClassifiedForReviewTransaction
): [string, string] {
  // Define a value to track the classification method for each type.
  let categoryConfidence = 'None';
  let taxCodeConfidence = 'None';

  // If a classification is present all classifications will use the same method.
  // Extracting the classification method of the first classification can be used to get the confidence level.
  if (classifiedTransaction.categories) {
    categoryConfidence = classifiedTransaction.categories[0].classifiedBy;
  }
  if (classifiedTransaction.taxCodes) {
    taxCodeConfidence = classifiedTransaction.taxCodes[0].classifiedBy;
  }

  // Return the confidence value strings in an array.
  return [categoryConfidence, taxCodeConfidence];
}

// Takes the ID of a new database 'For Review' transaction, as well as its related catagory classifications.
// Returns: A string inidicating success or an error.
async function handleCategoryConnections(
  newTransactionId: string,
  newTransactionCategories: ClassifiedElement[]
): Promise<string> {
  try {
    // Get the existing categories from the database.
    const existingCategories = await db.select().from(Category);

    // Iterate catagories connected to the 'For Review' transaction.
    for (const category of newTransactionCategories) {
      // Check if a related category already exists.
      const existingCategory = existingCategories.find(
        (dbCategory) => dbCategory.category === category.name
      );

      // Create a value to store either the found category Id or an Id from a newly created category.
      let databaseCategoryId = 0;

      // If the category does not exist, create a new one in the database.
      if (!existingCategory) {
        // Number of matches is set to 0, as no confirmed classification for this category exists yet.
        // If the user saves the 'For Reivew' transaction with this classification, the save function will increment the matches.
        const newCategory = await db
          .insert(Category)
          .values({
            category: category.name,
            matches: 0,
          })
          .returning();

        // Store the Id of the newly created category.
        databaseCategoryId = newCategory[0].id;
      } else {
        // If the category already exists, store its Id.
        databaseCategoryId = existingCategory.id;
      }

      // Create a connection between 'For Review' transaction object and the related category object.
      // Use the passed 'For Reivew' transaction Id, and the stored Id of the found or created category.
      await db.insert(ForReviewTransactionToCategories).values({
        transactionId: newTransactionId,
        categoryId: databaseCategoryId,
      });
    }
    // Return a string indicating success.
    return 'Success';
  } catch (error) {
    // Catch any errors, return an error string or the error message if it is present.
    if (error instanceof Error && error.message) {
      return error.message;
    } else {
      return 'Error, creating the category connection for a transaction failed';
    }
  }
}

// Takes the ID of a new database 'For Review' transaction, as well as its related tax code classifications.
// Returns: A string inidicating success or an error.
async function handleTaxCodeConnections(
  newTransactionId: string,
  newTransactionTaxCodes: ClassifiedElement[]
): Promise<string> {
  try {
    // Get the existing tax codes from the database.
    const existingTaxCodes = await db.select().from(TaxCode);

    // Iterate tax codes connected to the 'For Review' transaction.
    for (const taxCode of newTransactionTaxCodes) {
      // Check if the tax code already exists.
      const existingTaxCode = existingTaxCodes.find(
        (dbTaxCode) => dbTaxCode.taxCode === taxCode.name
      );

      // Create a value to store either the found category Id or an Id from a newly created category.
      let databaseTaxCodeId = 0;

      // If the tax code does not exist, create a new one in the database.
      if (!existingTaxCode) {
        // Number of matches is set to 0, as no confirmed classification for this tax code exists yet.
        // If the user saves the 'For Reivew' transaction with this classification, the save function will increment the matches.
        const newTaxCode = await db
          .insert(TaxCode)
          .values({
            taxCode: taxCode.name,
            matches: 0,
          })
          .returning();

        // Store the Id of the newly created tax code.
        databaseTaxCodeId = newTaxCode[0].id;
      } else {
        // If the tax code already exists, save its Id.
        databaseTaxCodeId = existingTaxCode.id;
      }

      // Create a connection between 'For Review' transaction object and the related tax code object.
      // Use the passed 'For Reivew' transaction Id, and the stored Id of the found or created tax code.
      await db.insert(ForReviewTransactionToTaxCodes).values({
        transactionId: newTransactionId,
        taxCodeId: databaseTaxCodeId,
      });
    }
    // Return a string indicating success.
    return 'Success';
  } catch (error) {
    // Catch any errors, return an error string or the error message if it is present.
    if (error instanceof Error && error.message) {
      return error.message;
    } else {
      return 'Error, creating the category connection for a transaction failed';
    }
  }
}
