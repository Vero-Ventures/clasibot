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
import type { ForReviewTransaction } from '@/types/ForReviewTransaction';
import type { QueryResult } from '@/types/QueryResult';

// Takes a raw 'For Review' transaction and removes the related object from the database.
// Returns: A Query Result object.
export async function removeForReviewTransactions(
  savedTransaction: ForReviewTransaction
): Promise<QueryResult> {
  try {
    // Get the session to extract the realm Id.
    const session = await getServerSession(options);
    const companyID = session?.realmId;

    // Check if a valid realm Id was found.
    if (companyID) {
      // Get the 'For Review' transaction by unique combo of realm Id and transaction Id.
      const transactionToDelete = await db
        .select()
        .from(DatabaseForReviewTransaction)
        .where(
          eq(DatabaseForReviewTransaction.companyId, companyID) &&
            eq(DatabaseForReviewTransaction.transactionId, savedTransaction.id)
        );

      // Use the ID of the found 'For Review' transaction to find and delete and relationships to categories.
      await db
        .delete(ForReviewTransactionToCategories)
        .where(
          eq(
            ForReviewTransactionToCategories.transactionId,
            transactionToDelete[0].id
          )
        );

      // Repeat the classification relationship deletion process with the tax codes.
      await db
        .delete(ForReviewTransactionToTaxCodes)
        .where(
          eq(
            ForReviewTransactionToTaxCodes.transactionId,
            transactionToDelete[0].id
          )
        );

      // After all relationships are deleted, delete the 'For Review' transaction from the database.
      await db
        .delete(DatabaseForReviewTransaction)
        .where(
          eq(DatabaseForReviewTransaction.companyId, companyID) &&
            eq(DatabaseForReviewTransaction.transactionId, savedTransaction.id)
        );

      // Return a success query result.
      return {
        result: 'Success',
        message:
          'Removing "For Review" transactions to database was successful.',
        detail:
          '"For Review" transactions and their connections removed from the database.',
      };
    } else {
      // Return an error query result indicating a realm Id could not be found.
      return {
        result: 'Error',
        message: 'Company ID for current user could not be found.',
        detail: 'Identifier Company ID could not be found in the session.',
      };
    }
  } catch (error) {
    // Catch any errors and return an error result with the error message if it present.
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
