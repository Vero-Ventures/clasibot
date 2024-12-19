'use server';

import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

import { db } from '@/db/index';
import { ForReviewTransaction } from '@/db/schema';
import { eq } from 'drizzle-orm';

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
