'use client';

import {
  addDatabaseForReviewTransactions,
  getDatabaseTransactions,
  removeAllForReviewTransactions,
} from '@/actions/db-review-transactions/index';

import {
  preformSyntheticLogin,
  startClassification,
  fetchTransactionsToClassify,
  fetchPredictionContext,
  startTransactionClassification,
  createClassifiedTransactions,
} from '@/actions/classification/index';

import type {
  ClassifiedForReviewTransaction,
  RawForReviewTransaction,
  FormattedForReviewTransaction,
} from '@/types/index';

// Preforms inital and final Classification process handling while calling helper for internal process handling.
// Takes: A state setter callback function to update the Classification state.
// Returns: A boolean indicating failure to load and an array of loaded Classified and Raw 'For Review' transactions.
export async function updateClassifyStates(
  setClassificationState: (newState: string) => void
): Promise<{
  loadFailure: boolean;
  loadedTransactions: (
    | ClassifiedForReviewTransaction
    | RawForReviewTransaction
  )[][];
}> {
  // Set the Classification process to be in progress and update the state.
  setClassificationState('Start Classify');

  // Call function to iterate through primary Classification process steps.
  const success = await handleBackendProcessStates(setClassificationState);

  // Check if the Classification process was successful.
  if (success) {
    // Update the state to indicate the Classification is finished.
    setClassificationState('Load New Classified Transactions');

    // Load the newly Classified 'For Review' transactions from the database.
    const loadResult = await getDatabaseTransactions();

    // Check the loading Query Result for an error.
    if (loadResult.queryResult.result === 'Error') {
      // Update the Classification state to indicate an error.
      setClassificationState('Error');

      // Return a value indicating it failed to ensure the loading failure modal is shown.
      // Returned array is set to be empty on failure to load to ensure only valid data is ever shown.
      return {
        loadFailure: true,
        loadedTransactions: [],
      };
    } else {
      // Update the Classification state to indicate Classification was successful.
      setClassificationState('Classify Complete');

      // Return a success loading result to ensure the completion modal is shown.
      // Also return the array of loaded Classified 'For Review' transactions.
      return {
        loadFailure: false,
        loadedTransactions: loadResult.transactions,
      };
    }
  }
  // Update the Classification state to indicate an error.
  setClassificationState('Error');
  // Return load failure as false for Classification failure.
  // Classification completion modal will be shown with an error result based.
  // Returned array is set to be empty on failure to load to ensure only valid data is ever shown.
  return {
    loadFailure: false,
    loadedTransactions: [],
  };
}

// Runs through the backend Classification process by Classification step handlers and updating the state in between.
// Takes: A state setter callback function to update the Classification state.
// Returns: A boolean value indicating if the backend Classification was successful.
async function handleBackendProcessStates(
  setClassificationState: (newState: string) => void
): Promise<boolean> {
  // Call setup handler to check for for a session and the related database Company object.
  const startResult = await startClassification();

  // Check result and either update to Synthetic Login state or return a failure value.
  if (startResult.result) {
    setClassificationState('Synthetic Login');
  } else {
    return false;
  }

  // Preform the Synthetic Login process needed for to get the 'For Review' transactions.
  const loginResult = await preformSyntheticLogin(startResult.realmId);

  console.log(loginResult)

  // Check result and either update to Get 'For Review' transactions state or return a failure value.
  if (loginResult.result) {
    setClassificationState('Get For Review Transactions');
  } else {
    return false;
  }

  // Before updating the users 'For Review' transactions, remove all old objects for the Company from the database.
  const clearDbResult = await removeAllForReviewTransactions(
    startResult.realmId
  );

  if (clearDbResult.result === 'Error') {
    return false;
  }

  // Get the 'For Review' transactions to be Classified.
  const transactionResults = await fetchTransactionsToClassify(
    loginResult.loginTokens!,
    startResult.realmId
  );

  // Check result and either update to Get Saved Transactions state or return a failure value.
  if (transactionResults.result) {
    setClassificationState('Get Saved Transactions');
  } else {
    return false;
  }

  // Get the Transactions and Comapany Info used in LLM predictions.
  const contextResult = await fetchPredictionContext();

  // Update state on successfully getting prediction context, otherwise return a failure value.
  if (contextResult.result) {
    setClassificationState('Classify For Review Transactions');
  } else {
    return false;
  }

  // Extract the formatted 'For Review' transactions from the fetch results for Classification.
  const formattedReviewTransactions = transactionResults.transactions.map(
    (subArray) => subArray[0] as FormattedForReviewTransaction
  );

  // Begin the backend Classification process by finding the Classifications for each 'For Review' transaction.
  const classificationsResult = await startTransactionClassification(
    contextResult.transactions,
    formattedReviewTransactions,
    contextResult.companyInfo!,
    loginResult.loginTokens!,
    startResult.realmId
  );

  // Update state on successfully starting Classification, otherwise return a failure value.
  if (classificationsResult.result) {
    setClassificationState('Create New Classified Transactions');
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
    setClassificationState('Save New Classified Transactions');
  } else {
    return false;
  }

  // Save the Classified 'For Review' transactions to the database.
  // Return the resulting Query Result created by the save function.
  const addingResult = await addDatabaseForReviewTransactions(
    creationResult.transactions,
    startResult.realmId
  );

  // Check Query Result from adding Classified 'For Review' transactions to database.
  // If result value is a success, backend Classification process is complete and a truth value is returned indicate success.
  if (addingResult.result === 'Success') {
    return true;
  } else {
    return false;
  }
}
