'use server';

import {
  checkBackendClassifyError,
  dismissBackendClassifyError,
} from '@/actions/backend-actions/database-functions/index';

// Checks if the user has a backend Classification error logged in the database.
// Returns: Boolean value for if a backend error was found.
export async function checkBackendClassifyErrorStatus(): Promise<boolean> {
  // Check the database Company object for a backend Classification error status.
  const errorCheckResponse = await checkBackendClassifyError();

  // Check for an error getting the backend Classification error status.
  if (errorCheckResponse.queryResult.result === 'Error') {
    // If check failed, assume no error status was logged and return false.
    console.error(errorCheckResponse.queryResult.message);
    return false;
  }

  // If the values was successfuly found, return the boolean database error value to the caller.
  return errorCheckResponse.errorStatus;
}

// Attempt to dismiss a backend Classification error from the database.
// Returns: A boolean value indicating if the error was dismissed successfuly.
export async function dismissBackendClassifyErrorStatus(): Promise<boolean> {
  // Update the database Company object to dismiss the backend Classification error status.
  const dismissErrorResponse = await dismissBackendClassifyError();

  // Check for an error dismissing the backend Classification error status.
  if (dismissErrorResponse.result === 'Error') {
    // If check failed, assume the error was not dismissed.
    console.error(dismissErrorResponse.message);
    return false;
  } else {
    // If the error status was dismissed successfuly, return a success boolean.
    return true;
  }
}
