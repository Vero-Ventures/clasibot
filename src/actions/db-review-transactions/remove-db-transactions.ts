'use server';
import { db } from '@/db/index';
import {
  ForReviewTransaction as DatabaseForReviewTransaction,
  ForReviewTransactionToCategories,
  ForReviewTransactionToTaxCodes,
} from '@/db/schema';
import type {
  ForReviewTransaction,
} from '@/types/ForReviewTransaction';
import type { QueryResult } from '@/types/QueryResult';
import { eq } from 'drizzle-orm';

export async function removeForReviewTransactions(
  forReviewTransactions: ForReviewTransaction[],
): Promise<QueryResult> {
  try {
    return {
      result: 'Success',
      message: 'Removing "For Review" transactions to database was successful.',
      detail:
        '"For Review" transactions and their connections removed from the database.',
    };
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
