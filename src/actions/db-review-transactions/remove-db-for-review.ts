'use server';

import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

import { db } from '@/db/index';
import {
  ForReviewTransaction as DatabaseForReviewTransaction,
  ForReviewTransactionToCategories,
  ForReviewTransactionToTaxCodes,
} from '@/db/schema';
import { eq } from 'drizzle-orm';

import type { RawForReviewTransaction, QueryResult } from '@/types/index';

// Removes 'For Review' transactions from the database after they have been saved to QuickBooks Online.
// Takes:  An array of Raw 'For Review' transaction objects.
// Returns: A Query Result object for removing the 'For Review' transactions from the database.
export async function removeSelectedForReviewTransaction(
  savedTransactions: {
    forReviewTransaction: RawForReviewTransaction;
    categoryId: string;
    taxCodeId: string;
  }[]
): Promise<QueryResult> {
  try {
    // Get the session and extract the Company realm Id.
    const session = await getServerSession(options);
    const companyId = session?.realmId;

    // Check if a valid Company realm Id was found.
    if (companyId) {
      // Iterate over the passed 'For Review' transactions.
      for (const savedTransaction of savedTransactions) {
        // Get the 'For Review' transaction by the unique combo of Company realm Id and database Transaction Id.
        const transactionToDelete = await db
          .select()
          .from(DatabaseForReviewTransaction)
          .where(
            eq(DatabaseForReviewTransaction.companyId, companyId) &&
              eq(
                DatabaseForReviewTransaction.reviewTransactionId,
                savedTransaction.forReviewTransaction.olbTxnId
              )
          );

        if (transactionToDelete[0]) {
          // Use the Id of the found 'For Review' transaction to find and delete and Relationships to Categories and to Tax Codes.
          await db
            .delete(ForReviewTransactionToCategories)
            .where(
              eq(
                ForReviewTransactionToCategories.reviewTransactionId,
                transactionToDelete[0].id
              )
            );

          await db
            .delete(ForReviewTransactionToTaxCodes)
            .where(
              eq(
                ForReviewTransactionToTaxCodes.reviewTransactionId,
                transactionToDelete[0].id
              )
            );

          // After all Relationships are deleted, delete the 'For Review' transaction from the database.
          await db
            .delete(DatabaseForReviewTransaction)
            .where(
              eq(DatabaseForReviewTransaction.id, transactionToDelete[0].id)
            );
        }
      }

      // Return a success Query Result.
      return {
        result: 'Success',
        message:
          'Removing "For Review" transactions to database was successful.',
        detail:
          '"For Review" transactions and their connections removed from the database.',
      };
    } else {
      // Return an error Query Result indicating the Company realm Id could not be found.
      return {
        result: 'Error',
        message: 'Company Id for current User could not be found.',
        detail: 'Identifier Company Id could not be found in the session.',
      };
    }
  } catch (error) {
    // Catch any errors and return an error Query Response, include the error message if it is present.
    if (error instanceof Error && error.message) {
      return {
        result: 'Error',
        message:
          'An error was encountered removing a "For Review" transaction or one of its connections.',
        detail: error.message,
      };
    } else {
      return {
        result: 'Error',
        message:
          'An error was encountered removing a "For Review" transaction or one of its connections.',
        detail: 'Unknown error encountered.',
      };
    }
  }
}

// Removes all 'For Review' transactions from the database before a new review is done.
// Takes: The realm Id of the company to delete the 'For Review' transactions for.
// Returns: A Query Result object for removing the 'For Review' transactions from the database.
export async function removeAllForReviewTransactions(
  realmId: string
): Promise<QueryResult> {
  try {
    // Get all 'For Review' transactions for the Company by the realm Id.
    const transactionsToDelete = await db
      .select()
      .from(DatabaseForReviewTransaction)
      .where(eq(DatabaseForReviewTransaction.companyId, realmId));

    // Iterate through the objects, deleting their related Classifications and the object itself.
    for (const databaseTransaction of transactionsToDelete) {
      // Delete the Related Classifications.
      await db
        .delete(ForReviewTransactionToCategories)
        .where(
          eq(
            ForReviewTransactionToCategories.reviewTransactionId,
            databaseTransaction.id
          )
        );
      await db
        .delete(ForReviewTransactionToTaxCodes)
        .where(
          eq(
            ForReviewTransactionToTaxCodes.reviewTransactionId,
            databaseTransaction.id
          )
        );
    }

    // After Relationships are deleted, delete the original 'For Review' transactions from the database.
    await db
      .delete(DatabaseForReviewTransaction)
      .where(eq(DatabaseForReviewTransaction.companyId, realmId));

    // Return a success Query Result.
    return {
      result: 'Success',
      message: 'Removing "For Review" transactions to database was successful.',
      detail:
        '"For Review" transactions and their connections removed from the database.',
    };
  } catch (error) {
    // Catch any errors and return an error Query Response, include the error message if it is present.
    if (error instanceof Error && error.message) {
      return {
        result: 'Error',
        message:
          'An error was encountered removing a "For Review" transaction or one of its connections.',
        detail: error.message,
      };
    } else {
      return {
        result: 'Error',
        message:
          'An error was encountered removing a "For Review" transaction or one of its connections.',
        detail: 'Unknown error encountered.',
      };
    }
  }
}
