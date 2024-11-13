'use server';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import { db } from '@/db/index';
import { Company } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { QueryResult } from '@/types/index';

// Checks if the backend Classification process resulted in an error for a specific Company.
// Returns: A Query Result object and the boolean value of the database Company error status.
export async function checkBackendClassifyError(): Promise<{
  queryResult: QueryResult;
  errorStatus: boolean;
}> {
  try {
    // Get the current session to get the Company realm Id.
    const session = await getServerSession(options);

    // Check that the Company realm Id could be found.
    if (!session?.realmId) {
      // Return an error Query Result indicating the session could not be found.
      // Also returns a false value for the error status presence.
      return {
        queryResult: {
          result: 'Error',
          message: 'Session could not be found.',
          detail:
            'The session containing the Company realm Id could not be found',
        },
        errorStatus: false,
      };
    }

    // Find the Company in the database with the matching Id.
    const company = await db
      .select()
      .from(Company)
      .where(eq(Company.realmId, session.realmId));

    // If a Company is found, check if it has recorded a backend Classification error.
    if (company[0]) {
      const backendError = company[0].classificationFailed;

      // Check any backend Classification errors have been recorded
      if (backendError) {
        // Return a message indicating an error status was logged during backend Classification.
        return {
          queryResult: {
            result: 'Success',
            message: 'Successful checked for backend Classification errors.',
            detail:
              'An error status was logged during prior backend Classification process failures.',
          },
          errorStatus: true,
        };
      } else {
        // Otherwise, return a success Query Result and a false error status.
        return {
          queryResult: {
            result: 'Success',
            message: 'Successful checked for backend Classification errors.',
            detail:
              'No error status was logged from prior backend Classification process failures.',
          },
          errorStatus: false,
        };
      }
    } else {
      // If no matching Company could be found, return an error result.
      return {
        queryResult: {
          result: 'Error',
          message: 'Company could not be found.',
          detail: 'No Company with that realm Id could be found.',
        },
        errorStatus: false,
      };
    }
  } catch (error) {
    // Catch any errors and return an error response, include the error message if it is present.
    if (error instanceof Error) {
      return {
        queryResult: {
          result: 'Error',
          message:
            'An Unexpected Error Occured Checking For Backend Classification Error Status.',
          detail: error.message,
        },
        errorStatus: false,
      };
    } else {
      return {
        queryResult: {
          result: 'Error',
          message:
            'An Unexpected Error Occured Checking For Backend Classification Error Status.',
          detail: 'N/A',
        },
        errorStatus: false,
      };
    }
  }
}

// Updates a Company in the database to dismiss the backend Classification error state.
// Used after user has been informed of the error and wishes to dismiss the error notification.
// Returns: A Query Result object.
export async function dismissBackendClassifyError(): Promise<QueryResult> {
  try {
    // Get the current session to get the Company realm Id.
    const session = await getServerSession(options);

    // Check that the Company realm Id could be found.
    if (!session?.realmId) {
      // Return an error Query Result indicating the session could not be found.
      return {
        result: 'Error',
        message: 'Session could not be found.',
        detail:
          'The session containing the Company realm Id could not be found',
      };
    }

    // Find the Company in the database with the matching Id.
    const company = await db
      .select()
      .from(Company)
      .where(eq(Company.realmId, session.realmId));

    // Check if a matching Company was found.
    if (company[0]) {
      // Update the found database Company object to dismiss the error status.
      await db
        .update(Company)
        .set({ classificationFailed: false })
        .where(eq(Company.id, company[0].id));

      // Return a success Query Result indicating the error status was dismissed.
      return {
        result: 'Success',
        message:
          'Successfuly dissmissed the backend Classification error status.',
        detail:
          'Backend Classification error status for the Company was set to false.',
      };
    } else {
      // If no matching Company could be found, return an error result.
      return {
        result: 'Error',
        message: 'Company could not be found.',
        detail: 'No Company with that realm Id could be found.',
      };
    }
  } catch (error) {
    // Catch any errors and return an error response, include the error message if it is present.
    if (error instanceof Error) {
      return {
        result: 'Error',
        message:
          'An Unexpected Error Occured While Updating Backend Classification Error Status.',
        detail: 'N/A',
      };
    } else {
      return {
        result: 'Error',
        message:
          'An Unexpected Error Occured While Updating Backend Classification Error Status.',
        detail: 'N/A',
      };
    }
  }
}
