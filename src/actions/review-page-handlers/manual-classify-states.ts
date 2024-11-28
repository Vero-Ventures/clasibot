'use client';

import {
  getDatabaseTransactions,
  removeAllForReviewTransactions,
} from '@/actions/db-review-transactions/index';

import { addForReviewTransactions } from '@/actions/backend-actions/database-functions/index';

import {
  preformSyntheticLogin,
  startManualClassification,
  fetchTransactionsToClassify,
  fetchPredictionContext,
  startTransactionClassification,
  createClassifiedTransactions,
} from '@/actions/backend-actions/classification/index';

import type {
  ClassifiedForReviewTransaction,
  RawForReviewTransaction,
  FormattedForReviewTransaction,
} from '@/types/index';

// Starts the manual Classificaion process as well as running the Classified Transaction loading once it completes.
// Takes: A state setter callback function to update the manual Classificaion state.
// Returns: A boolean indicating failure to load and  an array of loaded Classified and Raw 'For Review' transactions.
export async function handleStateForManualClassify(
  setManualClassificationState: (newState: string) => void
): Promise<{
  loadFailure: boolean;
  loadedTransactions: (
    | ClassifiedForReviewTransaction
    | RawForReviewTransaction
  )[][];
}> {
  // Set the Classification process to be in progress and update the state.
  setManualClassificationState('Start Classify');

  // Call function to iterate through manual Classification process and update state accordingly.
  const success = await handleBackendProcessStates(
    setManualClassificationState
  );

  // Check if the Classification process was successful.
  if (success) {
    // Update the state to indicate the Classification is finished.
    setManualClassificationState('Load New Classified Transactions');

    // Load the newly Classified 'For Review' transactions from the database.
    const loadResult = await getDatabaseTransactions();

    // Check the loading Query Result for an error.
    if (loadResult.queryResult.result === 'Error') {
      // Update the manual Classification state to indicate an error.
      setManualClassificationState('Error');

      // Return a value indicating it failed to ensure the loading failure modal is shown.
      // Returned array is set to be empty on failure to load to ensure only valid data is ever shown.
      return {
        loadFailure: true,
        loadedTransactions: [],
      };
    } else {
      // Update the manual Classification state to indicate manual Classification was successful.
      setManualClassificationState('Classify Complete');

      // Return a success loading result to ensure the completion modal is shown.
      // Also return the array of loaded Classified 'For Review' transactions.
      return {
        loadFailure: false,
        loadedTransactions: loadResult.transactions,
      };
    }
  }
  // Update the manual Classification state to indicate an error.
  setManualClassificationState('Error');
  // Return load failure as false for Classification failure.
  // Classification completion modal will be shown with an error result based.
  // Returned array is set to be empty on failure to load to ensure only valid data is ever shown.
  return {
    loadFailure: false,
    loadedTransactions: [],
  };
}

// Runs through the backend Classificaion process by calling backend handlers and updating the state in between.
// Takes: A state setter callback function to update the manual Classificaion state.
// Returns: A boolean value indicating if the backend Classificaion was successful.
async function handleBackendProcessStates(
  setManualClassificationState: (newState: string) => void
): Promise<boolean> {
  // Check for a session and the related database Company object.
  const startResult = await startManualClassification();

  // Update state on successfully starting the Classificaion process, otherwise return a failure value.
  if (startResult.result) {
    setManualClassificationState('Synthetic Login');
  } else {
    return false;
  }

  // Preform the synthetic login process needed for Classificaion.
  const loginResult = await preformSyntheticLogin(
    startResult.realmId,
    startResult.firmName
  );

  // Update state on successfully preforming synthetic login, otherwise return a failure value.
  if (loginResult.result) {
    setManualClassificationState('Get For Review Transactions');
  } else {
    return false;
  }

  // If synthetic login was successful, before continuing remove all old 'For Review' transactions for the Company from the database.
  removeAllForReviewTransactions(startResult.realmId);

  // Get the 'For Review' transactions to be Classified.
  const transactionResults = await fetchTransactionsToClassify(
    loginResult.loginTokens!,
    startResult.realmId
  );

  // Update state on successfully fetching the 'For Review' transactions, otherwise return a failure value.
  if (transactionResults.result) {
    setManualClassificationState('Get Saved Transactions');
  } else {
    return false;
  }

  // Extract the formatted 'For Review' transactions to use in Classification.
  const formattedReviewTransactions = transactionResults.transactions.map(
    (subArray) => subArray[0] as FormattedForReviewTransaction
  );

  // Get the Transactions and Comapany Info used in LLM predictions.
  const contextResult = await fetchPredictionContext();

  // Update state on successfully getting prediction context, otherwise return a failure value.
  if (contextResult.result) {
    setManualClassificationState('Classify For Review Transactions');
  } else {
    return false;
  }

  // Begin the backend Classificaion process by finding the Classificaions for each 'For Review' transaction.
  const classificationsResult = await startTransactionClassification(
    contextResult.transactions,
    formattedReviewTransactions,
    contextResult.companyInfo!,
    loginResult.loginTokens!,
    startResult.realmId
  );

  // Update state on successfully starting Classificaion, otherwise return a failure value.
  if (classificationsResult.result) {
    setManualClassificationState('Create New Classified Transactions');
  } else {
    return false;
  }

  // Take the created Classifications and use them to create Classified 'For Review' transaction objects.
  const creationResult = await createClassifiedTransactions(
    transactionResults.transactions,
    classificationsResult.classificationResults
  );

  // Update state on successfully creating Classified 'For Review' transactions, otherwise return a failure value.
  if (creationResult.result) {
    setManualClassificationState('Save New Classified Transactions');
  } else {
    return false;
  }

  // Save the Classified 'For Review' transactions to the database.
  // Return the resulting Query Result created by the save function.
  const addingResult = await addForReviewTransactions(
    creationResult.transactions,
    startResult.realmId
  );

  // Check Query Result from adding Classified 'For Review' transactions to database.
  // If result value is a success, backend Classificaion process is complete and a truth value is returned indicate success.
  if (addingResult.result === 'Success') {
    return true;
  } else {
    return false;
  }
}
