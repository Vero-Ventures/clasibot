'use server';
import {
  checkBackendClassifyError,
  dismissBackendClassifyError,
} from '@/actions/backend-actions/database-functions/backend-classify-failure';

// Checks if the user has a backend Classification error logged in the database and updates the related frontend UI element states.
// Takes: State update methods for if a backend Classification error was found and for showing the related UI element.
// Returns: None, uses state updaters to pass result frontend.
export async function checkBackendClassifyErrorStatus(
  setBackendClassifyError: (newState: boolean) => void,
  setShowBackendClassifyErrorNotification: (newState: boolean) => void
) {
  // Check the database Company object for a backend Classification error status.
  const errorCheckResponse = await checkBackendClassifyError();

  // Check for an error getting the backend Classification error status.
  if (errorCheckResponse.queryResult.result === 'Error') {
    // If check failed, assume no error status was logged.
    console.error(errorCheckResponse.queryResult.message);
    return;
  }

  // Check if an backend Classification error staus was recorded.
  if (errorCheckResponse.errorStatus) {
    // Update the error state and display the frontend element to inform the user.
    setBackendClassifyError(true);
    setShowBackendClassifyErrorNotification(true);
  }
}

// Attempt to dismiss a backend Classification error and update the related frontend UI element states.
// Takes: State update methods for a string that indicates if the attempt to dismiss the error failed.
//        Also takes state setters for if a backend Classification error was found and for showing the related UI element.
// Returns: None, uses state updaters to pass result frontend.
export async function dismissBackendClassifyErrorStatus(
  setDismissResultMessage: (newState: string) => void,
  setBackendClassifyError: (newState: boolean) => void,
  setShowBackendClassifyErrorNotification: (newState: boolean) => void
) {
  // Update the database Company object to dismiss the backend Classification error status.
  const dismissErrorResponse = await dismissBackendClassifyError();

  // Check for an error dismissing the backend Classification error status.
  if (dismissErrorResponse.result === 'Error') {
    // If check failed, assume the error was not dismissed.
    setDismissResultMessage('Error');
    console.error(dismissErrorResponse.message);
  } else {
    // If the error status was dismissed successfuly, update the error status check states.
    setBackendClassifyError(false);
    setShowBackendClassifyErrorNotification(false);
    setDismissResultMessage('Success');
  }
}
