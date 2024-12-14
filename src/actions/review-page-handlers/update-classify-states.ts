'use client';

import {
  addDatabaseForReviewTransactions,
  getDatabaseTransactions,
  removeAllForReviewTransactions,
} from '@/actions/db-review-transactions/index';

import {
  startClassification,
  preformSyntheticLogin,
  fetchTransactionsToClassify,
  fetchPredictionContext,
  startTransactionClassification,
  createClassifiedTransactions,
} from '@/actions/classification/index';

import type {
  RawForReviewTransaction,
  FormattedForReviewTransaction,
  ClassifiedForReviewTransaction,
} from '@/types/index';

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
  // Set the Classification process to be in progress and wait a second for frontend to update.
  setClassificationState('Start Classify');
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, 1000);
  });

  // Call function to iterate through primary Classification process steps.
  const success = await handleBackendProcessStates(setClassificationState);

  // Check if the primary Classification process was successful.
  if (success) {
    // Update the state to indicate the primary Classification is finished and wait a second for frontend to update.
    setClassificationState('Load New Classified Transactions');
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });

    // Load the newly Classified 'For Review' transactions.
    const loadResult = await getDatabaseTransactions();

    // Check the loading Query Result for an error.
    if (loadResult.queryResult.result === 'Error') {
      // Update the Classification state to indicate an error.
      setClassificationState('Error');

      // Return a value indicating the Classification process failed.
      // Returned array is set to empty on failure to load to ensure no invalid data is ever shown.
      return {
        loadFailure: true,
        loadedTransactions: [],
      };
    } else {
      // Update the Classification state to indicate Classification was successful.
      setClassificationState('Classify Complete');

      // Return a value indicating the Classification process succeeded.
      // Also return the array of loaded Classified 'For Review' transactions.
      return {
        loadFailure: false,
        loadedTransactions: loadResult.transactions,
      };
    }
  }
  // Update the Classification state to indicate an error.
  setClassificationState('Error');

  // Return a value indicating the Classification process failed.
  // Returned array is set to empty on failure to load to ensure no invalid data is ever shown.
  return {
    loadFailure: false,
    loadedTransactions: [],
  };
}

// Takes: A state setter callback function to update the Classification state.
// Returns: A boolean value indicating if the backend Classification was successful.
async function handleBackendProcessStates(
  setClassificationState: (newState: string) => void
): Promise<boolean> {
  // Call setup handler to check for for a session and the related Company.
  const startResult = await startClassification();

  // Check result and either update to Synthetic Login state or return a failure value.
  if (startResult.result) {
    // Update the Classification state and wait a second for frontend to update.
    setClassificationState('Synthetic Login');
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  } else {
    return false;
  }

  // Preform the Synthetic Login process needed to get the 'For Review' transactions.
  const loginResult = await preformSyntheticLogin(startResult.realmId);

  // Check result and either update to Get 'For Review' transactions state or return a failure value.
  if (loginResult.result) {
    // Update the Classification state and wait a second for frontend to update.
    setClassificationState('Get For Review Transactions');
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  } else {
    return false;
  }

  // Before updating the users 'For Review' transactions, remove all old 'For Review' transactions from the database.
  const clearDbResult = await removeAllForReviewTransactions(
    startResult.realmId
  );

  // Check if the database clearing process resulted in an error and return a failure boolean if it did.
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
    // Update the Classification state and wait a second for frontend to update.
    setClassificationState('Get Saved Transactions');
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  } else {
    return false;
  }

  // Get the Transactions and Comapany Info used in LLM predictions.
  const contextResult = await fetchPredictionContext();

  // Check result and either update to Classify 'For Review' state or return a failure value.
  if (contextResult.result) {
    // Update the Classification state and wait a second for frontend to update.
    setClassificationState('Classify For Review Transactions');
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  } else {
    return false;
  }

  // Extract the formatted 'For Review' transactions from the fetched results.
  const formattedReviewTransactions = transactionResults.transactions.map(
    (subArray) => subArray[0] as FormattedForReviewTransaction
  );

  // Begin the backend Classification process by finding the Classifications for each 'For Review' transaction.
  const classificationsResult = await startTransactionClassification(
    contextResult.transactions,
    formattedReviewTransactions,
    contextResult.companyInfo!
  );

  // Check result and either update to Creating Classified Transactions state or return a failure value.
  if (classificationsResult.result) {
    // Update the Classification state and wait a second for frontend to update.
    setClassificationState('Create New Classified Transactions');
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  } else {
    return false;
  }

  // Take the created Classifications and use them to create Classified 'For Review' transactions.
  const creationResult = await createClassifiedTransactions(
    transactionResults.transactions,
    classificationsResult.classificationResults
  );

  // Check result and either update to Saving Classified Transactions state or return a failure value.
  if (creationResult.result) {
    // Update the Classification state and wait a second for frontend to update.
    setClassificationState('Save New Classified Transactions');
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  } else {
    return false;
  }

  // Save the Classified 'For Review' transactions.
  const addingResult = await addDatabaseForReviewTransactions(
    creationResult.transactions,
    startResult.realmId
  );

  // Check Query Result from adding Classified 'For Review' transactions and return a success boolean.
  if (addingResult.result === 'Success') {
    return true;
  } else {
    return false;
  }
}
