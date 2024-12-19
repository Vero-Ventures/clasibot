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

// Takes:  An array of Raw 'For Review' transactions.
// Returns: A Query Result for removing the 'For Review' transactions.
export async function removeSelectedForReviewTransaction(
  savedTransactions: {
    forReviewTransaction: RawForReviewTransaction;
    categoryId: string;
    taxCodeId: string;
  }[]
): Promise<QueryResult> {
  try {
    // Get the session and extract the realm Id.
    const session = await getServerSession(options);
    const realmId = session?.realmId;

    // Check if a valid realm Id was found.
    if (realmId) {
      // Iterate over the passed 'For Review' transactions.
      for (const savedTransaction of savedTransactions) {
        // Get the 'For Review' transaction by the unique combo of realm Id and QuickBooks Transaction Id.
        const transactionToDelete = await db
          .select()
          .from(DatabaseForReviewTransaction)
          .where(
            eq(DatabaseForReviewTransaction.companyId, realmId) &&
              eq(
                DatabaseForReviewTransaction.reviewTransactionId,
                savedTransaction.forReviewTransaction.olbTxnId
              )
          );

        // Check that a matching 'For Review' transaction was found
        if (transactionToDelete[0]) {
          // Find and delete and 'For Review' transactions Relationships to Categories and to Tax Codes.
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

          // After all Relationships are deleted, delete the 'For Review' transaction.
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
      // Return an error Query Result indicating the realm Id could not be found.
      return {
        result: 'Error',
        message: 'Company Id for current User could not be found.',
        detail: 'Identifier Company Id Could Not Be Found In The Session.',
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
        detail: 'Unknown Error Occured.',
      };
    }
  }
}

// Takes: The realm Id of the company to delete the 'For Review' transactions for.
// Returns: A Query Result for removing the 'For Review' transactions.
export async function removeAllForReviewTransactions(
  realmId: string
): Promise<QueryResult> {
  try {
    // Get all 'For Review' transactions for the Company by the unique realm Id.
    const transactionsToDelete = await db
      .select()
      .from(DatabaseForReviewTransaction)
      .where(eq(DatabaseForReviewTransaction.companyId, realmId));

    // Iterate through the 'For Review' transactions, deleting it and its related Classifications.
    for (const databaseTransaction of transactionsToDelete) {
      // Delete the Related Classifications for the 'For Review' transaction.
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

    // After Relationships are deleted, delete all the original 'For Review' transactions.
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
        detail: 'Unknown Error Occured.',
      };
    }
  }
}
