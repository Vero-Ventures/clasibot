'use server';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import { db } from '@/db/index';
import {
  ForReviewTransaction as DatabaseForReviewTransaction,
  ForReviewTransactionToCategories,
  ForReviewTransactionToTaxCodes,
} from '@/db/schema';
import type { ForReviewTransaction } from '@/types/ForReviewTransaction';
import type { QueryResult } from '@/types/QueryResult';
import { eq } from 'drizzle-orm';

export async function removeForReviewTransactions(
  savedTransaction: ForReviewTransaction
): Promise<QueryResult> {
  try {
    // Get the session to get the company ID (realm ID).
    const session = await getServerSession(options);
    const companyID = session?.realmId;
    // Continue with deletion if a realm ID was found.
    if (companyID) {
      // Get the transaction by unique combo of company ID and transaction ID.
      const transactionToDelete = await db
        .select()
        .from(DatabaseForReviewTransaction)
        .where(
          eq(DatabaseForReviewTransaction.companyId, companyID) &&
            eq(DatabaseForReviewTransaction.transactionId, savedTransaction.id)
        );
      // Delete any relationships with categories.
      await db
        .delete(ForReviewTransactionToCategories)
        .where(
          eq(
            ForReviewTransactionToCategories.transactionId,
            transactionToDelete[0].id
          )
        );
      // Delete any relationships with tax codes.
      await db
        .delete(ForReviewTransactionToTaxCodes)
        .where(
          eq(
            ForReviewTransactionToTaxCodes.transactionId,
            transactionToDelete[0].id
          )
        );

      // Delete the 'for review' transaction itself.
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
      // Return an error query result indicating companyID could not be found.
      return {
        result: 'Error',
        message: 'Company ID for current user could not be found.',
        detail: 'Identifier Company ID could not be found in the session.',
      };
    }
  } catch (error) {
    // Catch any errors, return the message if there is one, otherwise return a custom error message.
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
