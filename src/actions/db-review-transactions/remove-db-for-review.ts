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

// Removes a 'For Review' transaction from the database after it is saved to User QuickBooks Transactions.
// Takes:  A Raw 'For Review' transaction object
// Returns: A Query Result object for removing the Transaction from the database.
export async function removeForReviewTransactions(
  savedTransaction: ForReviewTransaction
): Promise<QueryResult> {
  try {
    // Get the session and extract the Company realm Id.
    const session = await getServerSession(options);
    const companyId = session?.realmId;

    // Check if a valid Company realm Id was found.
    if (companyId) {
      // Get the 'For Review' transaction by the unique combo of Company realm Id and database Transaction Id.
      const transactionToDelete = await db
        .select()
        .from(DatabaseForReviewTransaction)
        .where(
          eq(DatabaseForReviewTransaction.companyId, companyId) &&
            eq(
              DatabaseForReviewTransaction.reviewTransactionId,
              savedTransaction.id
            )
        );

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
          eq(DatabaseForReviewTransaction.companyId, companyId) &&
            eq(
              DatabaseForReviewTransaction.reviewTransactionId,
              savedTransaction.id
            )
        );

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