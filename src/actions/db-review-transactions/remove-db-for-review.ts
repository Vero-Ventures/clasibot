'use server';

import { db } from '@/db/index';
import {
  ForReviewTransaction,
  ForReviewTransactionToCategories,
  ForReviewTransactionToTaxCodes,
} from '@/db/schema';
import { eq } from 'drizzle-orm';

import type { QueryResult } from '@/types/index';

// Takes: The realm Id of the company to delete the 'For Review' transactions for.
// Returns: A Query Result for removing the 'For Review' transactions.
export async function removeAllForReviewTransactions(
  realmId: string
): Promise<QueryResult> {
  try {
    // Get all 'For Review' transactions for the Company by the unique realm Id.
    const transactionsToDelete = await db
      .select()
      .from(ForReviewTransaction)
      .where(eq(ForReviewTransaction.companyId, realmId));

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
      .delete(ForReviewTransaction)
      .where(eq(ForReviewTransaction.companyId, realmId));

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
