'use server';
import { manualClassify } from '@/actions/backend-actions/classification/manual-classify';
import { getDatabaseTransactions } from '@/actions/db-review-transactions/get-db-for-review';
import type {
  ForReviewTransaction,
  ClassifiedForReviewTransaction,
} from '@/types/ForReviewTransaction';

// Starts the manual Classification process and tracks the progress for frontend.
// Takes: State update methods to update frontend on the Classification process.
// Returns: None, uses state updaters to pass result information to frontend.
export async function startManualClassification(
  setManualClassificationState: (newState: string) => void,
  setIsClassifying: (newState: boolean) => void,
  setErrorLoadingTransactions: (newState: boolean) => void,
  setOpenFinishedClassificationModal: (newState: boolean) => void,
  setLoadedTransactions: (
    newTransactions: (ForReviewTransaction | ClassifiedForReviewTransaction)[][]
  ) => void
) {
  // Set the Classification process to be in progress and update the state.
  setManualClassificationState('Start Classify');
  setIsClassifying(true);

  // Make call to backend 'For Review' Classification function with the method to update the Classification state.
  const success = await manualClassify(setManualClassificationState);

  // Check if the Classification was successful and update the state accordingly.
  // State handling on error is done inside the Classification function.
  if (success) {
    // Update the state to indicate the Classification is finished.
    setManualClassificationState('Load Classified Transactions');
    // Load the newly Classified 'For Review' transactions from the database after the manual Classification.

    // Load the newly Classified 'For Review' transactions from the database after the manual Classification.
    const loadResult = await getDatabaseTransactions();

    // Check result of the load for an error Query Result for.
    if (loadResult[0].result === 'Error') {
      // If an error was found, open the related error modal and set the state to indicate an error.
      setErrorLoadingTransactions(true);
      setManualClassificationState('Error');
    } else {
      // On success, show the finished Classification modal to inform the user.
      setOpenFinishedClassificationModal(true);
      // Set the state to indicate completion and hiding the related frontend element.
      setManualClassificationState('Classify Complete');
    }
    // Update the loaded Transactions state regardless of outcome.
    // Returned array is set to be empty from error reutrns to prevent showing old data.
    setLoadedTransactions(loadResult[1]);
  } else {
    // When Classification process returns an error, show the finished Classification modal that will inform the user.
    setOpenFinishedClassificationModal(true);
  }
  // Regardless of outcome, set the Classification process to be completed.
  setIsClassifying(false);
}

export async function changeManualClassificationState(
  manualClassificationState: string,
  setManualClassificationModalMessage: (newState: string) => void,
  setOpenManualClassificationModal: (newState: boolean) => void,
  setNumCompletedProcesses: (newState: number) => void
) {
  // Use switch case to define behavior based on the state string.
  // States are always set prior to the related action being started.
  switch (manualClassificationState) {
    // State handlers define when to show and hide the manual Classification state modal.
    // Also defines what is currently being done in the manual Classification and the number of completed steps.
    case 'Start Classify':
      // Defines the start of the process and shows the state tracker modal.
      setManualClassificationModalMessage('Starting classification process.');
      setOpenManualClassificationModal(true);
      break;
    case 'Synthetic Login':
      setManualClassificationModalMessage('Clasibot bookkeeper logging in.');
      setNumCompletedProcesses(1);
      break;
    case 'Get For Review Transactions':
      setManualClassificationModalMessage(
        'Fetching new transactions for review.'
      );
      setNumCompletedProcesses(2);
      break;
    case 'Get Saved Transactions':
      setManualClassificationModalMessage(
        'Checking previously classified transactions.'
      );
      setNumCompletedProcesses(3);
      break;
    case 'Classify For Review Transactions':
      setManualClassificationModalMessage('Classifying the new transactions.');
      setNumCompletedProcesses(4);
      break;
    case 'Create New Classified Transactions':
      setManualClassificationModalMessage(
        'Creating the new classified transactions.'
      );
      setNumCompletedProcesses(5);
      break;
    case 'Save New Classified Transactions':
      setManualClassificationModalMessage(
        'Saving your newly classified transactions.'
      );
      setNumCompletedProcesses(6);
      break;
    case 'Load New Classified Transactions':
      setManualClassificationModalMessage(
        'Loading your transaction review table.'
      );
      setNumCompletedProcesses(7);
      break;
    case 'Classify Complete':
      // Completion state that hide the modal after a brief delay.
      setManualClassificationModalMessage('Classification Complete!');
      setNumCompletedProcesses(8);
      setTimeout(() => {
        setOpenManualClassificationModal(false);
        setNumCompletedProcesses(0);
      }, 2000);
      break;
    case 'Error':
      // Error state that hide the modal after a brief delay.
      setManualClassificationModalMessage('An Unexpected Error Occured');
      setNumCompletedProcesses(-1);
      setTimeout(() => {
        setOpenManualClassificationModal(false);
        setNumCompletedProcesses(0);
      }, 2000);
      break;
  }
}
