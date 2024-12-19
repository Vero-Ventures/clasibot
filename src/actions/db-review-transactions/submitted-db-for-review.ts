'use server';

import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

import { db } from '@/db/index';
import { ForReviewTransaction } from '@/db/schema';
import { eq } from 'drizzle-orm';

import type { RawForReviewTransaction, QueryResult } from '@/types/index';

// Returns: A boolean indicating if 'For Review' transactions to undo were found.
export async function checkForUndoTransactions(): Promise<boolean> {
  try {
    // Get the session and extract the realm Id.
    const session = await getServerSession(options);
    const realmId = session?.realmId;

    // Check if a valid realm Id was found.
    if (realmId) {
      // Get all 'For Review' transactions for the Company where recently saved is true.
      const undoTransactions = await db
        .select()
        .from(ForReviewTransaction)
        .where(
          eq(ForReviewTransaction.companyId, realmId) &&
            eq(ForReviewTransaction.recentlySaved, true)
        );

      // Return if recently saved (undo-able) 'For Review' transactions were found.
      return undoTransactions.length > 0;
    }

    // If realm Id could not be found, log an error and return false to indicate no transactions were found.
    console.error('Realm Id Could Not Be Found.');

    return false;
  } catch (error) {
    // Catch any errors and log an error, include the error message if it is present.
    if (error instanceof Error && error.message) {
      console.error(
        'Error Checking Database For Review Transactions: ' + error.message
      );
    } else {
      console.error(
        'Unexpected Error Checking Database For Review Transactions.'
      );
    }
    // On error return false to indicate no 'For Review' transactions to undo were found.
    return false;
  }
}

// Takes:  An array of Raw 'For Review' transactions.
// Returns: A Query Result for updating the 'For Review' transactions.
export async function setSavedForReviewTransactions(
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
        // Set the 'For Review' transaction to be recently saved by the unique combo of realm Id and QuickBooks Transaction Id.
        await db
          .update(ForReviewTransaction)
          .set({ recentlySaved: true })
          .where(
            eq(ForReviewTransaction.companyId, realmId) &&
              eq(
                ForReviewTransaction.reviewTransactionId,
                savedTransaction.forReviewTransaction.olbTxnId
              )
          );
      }

      // Return a success Query Result.
      return {
        result: 'Success',
        message:
          'Setting "For Review" transactions as recently saved was successful.',
        detail:
          'All passed "For Review" transactions were set as recently saved.',
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
          'An error was encountered setting a "For Review" transaction as recently saved.',
        detail: error.message,
      };
    } else {
      return {
        result: 'Error',
        message:
          'An error was encountered setting a "For Review" transaction as recently saved.',
        detail: 'Unknown Error Occured.',
      };
    }
  }
}
