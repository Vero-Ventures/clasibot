'use client';

import { useEffect, useState } from 'react';

import { changeManualClassificationState } from '@/actions/backend-actions/classification/index';
import { getDatabaseTransactions } from '@/actions/db-review-transactions/index';

import {
  checkBackendClassifyError,
  dismissBackendClassifyError,
} from '@/actions/backend-actions/database-functions/index';

import {
  getNextReviewDate,
  handleStateForManualClassify,
  initalizeLoadedTransactions,
  saveSelectedTransactions,
} from '@/actions/review-page-handlers/index';

import { ReviewTable } from '@/components/review-elements/review-table';

import { ManualReviewButton } from '@/components/inputs/manual-review-button';

import {
  ManualClassifyProgessModal,
  ManualClassifyCompleteModal,
  ErrorLoadingTransactionsModal,
  SaveClassifiedTransactionsModal,
} from '@/components/modals/index';

import type {
  CompanyInfo,
  ForReviewTransaction,
  ClassifiedForReviewTransaction,
} from '@/types/index';

// Takes: A Company Info object and boolean indicating when the Company Info is loaded.
export default function ReviewPage({
  companyInfo,
}: Readonly<{
  companyInfo: CompanyInfo;
}>) {
  // Define state to track the localized time of the next backend Classification.
  const [nextBackendClassifyDate, setNextBackendClassifyDate] =
    useState<string>('');

  // On page load, gets the date of the next Saturday at 12 AM UTC.
  useEffect(() => {
    // Calls the handler method to await and set state with the date value.
    const handleBackendClassifyDateCall = async () => {
      setNextBackendClassifyDate(await getNextReviewDate());
    };
    handleBackendClassifyDateCall();
  }, []);

  // Create states to track the loaded Transactions and their assosiated Accounts.
  const [loadedTransactions, setLoadedTransactions] = useState<
    (ForReviewTransaction | ClassifiedForReviewTransaction)[][]
  >([]);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [errorLoadingTransactions, setErrorLoadingTransactions] =
    useState<boolean>(false);

  // Loads the previously Classified and saved Transactions whenever Company Info loading state updates.
  useEffect(() => {
    // Load the Transactions from the database.
    const loadForReviewTransactions = async () => {
      // Load the Transactions and check the Query Result for an error.
      const loadResult = await getDatabaseTransactions();
      if (loadResult.queryResult.result === 'Error') {
        // If an error was found, open the related error modal.
        setErrorLoadingTransactions(true);
      }
      // Update the loaded Transactions state regardless of outcome. Array is set to be empty on error.
      setLoadedTransactions(loadResult.transactions);
    };
    loadForReviewTransactions();
  }, []);

  // Create states to track the states of a Manual Classification process.
  const [manualClassificationState, setManualClassificationState] =
    useState<string>('');
  const [openManualClassificationModal, setOpenManualClassificationModal] =
    useState<boolean>(false);
  const [
    manualClassificationModalMessage,
    setManualClassificationModalMessage,
  ] = useState<string>('');
  const [openFinishedClassificationModal, setOpenFinishedClassificationModal] =
    useState<boolean>(false);

  // Starts the manual Classification process, handles the intial and end states, and modal display on finish.
  function handleManualClassification() {
    // Calls the handler method to await and set state with the manual Classification results.
    const handleCall = async () => {
      const classificationResults = await handleStateForManualClassify(
        setManualClassificationState
      );

      // Check if the manual Classification failed on loading Classified 'For Review' transactions.
      if (classificationResults.loadFailure) {
        // If failure to load occurred, show the error loading modal.
        setErrorLoadingTransactions(true);
      } else {
        // Otherwise the completion modal (success or failure) is shown.
        setOpenFinishedClassificationModal(true);
      }

      // Update the Classified 'For Review' transaction states with returned values (or empty array on error).
      setLoadedTransactions(classificationResults.loadedTransactions);
    };
    handleCall();
  }

  const [numCompletedProcesses, setNumCompletedProcesses] = useState<number>(0);
  const numManualClassificationStates = 8;
  // Define handler for different manual Classification states.
  useEffect(() => {
    const handleManualClassificationChangeCall = async () => {
      // Calls the handler method to await the new state values.
      const processStates = await changeManualClassificationState(
        manualClassificationState
      );

      // Set states with the manual Classification process values.
      setManualClassificationModalMessage(processStates.displayValue);
      setNumCompletedProcesses(processStates.currentProcess);

      // For end states (-1 / 8), update states to close the modal and reset the progess value.
      if (
        processStates.currentProcess === -1 ||
        processStates.currentProcess === 8
      ) {
        setTimeout(() => {
          setOpenManualClassificationModal(false);
          setNumCompletedProcesses(0);
        }, 2000);
      }
    };
    handleManualClassificationChangeCall();
  }, [manualClassificationState]);

  // Create states for checking if an error occured during backend Classification.
  // Unused: States are marked as unused until frontend notice implementation is completed.
  const [_backendClassifyError, setBackendClassifyError] =
    useState<boolean>(false);
  const [
    _showBackendClassifyErrorNotification,
    setShowBackendClassifyErrorNotification,
  ] = useState<boolean>(false);
  const [_dismissResultMessage, setDismissResultMessage] = useState<string>('');

  // Check for an error whenever Company Info load state updates.
  // Done at the same time as loading the Saved and Classified Transactions and the database 'For Review' transactions.
  useEffect(() => {
    // Call the helper function to check for backend Classification failure.
    const handleCheckBackendErrorCall = async () => {
      const foundError = await checkBackendClassifyError();
      // Set the found error and display error notice state based on the found error value.
      setBackendClassifyError(foundError.errorStatus);
      setShowBackendClassifyErrorNotification(foundError.errorStatus);
    };
    handleCheckBackendErrorCall();
  }, []);

  // Updates the database Company object to dismiss backend Classification error.
  // Unused: Function is marked as unused until frontend notice that allows the user to dismiss the error is implemented.
  async function _dismissBackendClassifyErrorStatus() {
    // Calls the handler method to await the new state values.
    const handleDismissBackendErrorCall = async () => {
      const dissmissResult = await dismissBackendClassifyError();
      // Set the dismissal message using the dismissal Query Result.
      setDismissResultMessage(dissmissResult.result);
      // On success, set to be display to hidden and the found error state to false.
      if (dissmissResult.result === 'Success') {
        setBackendClassifyError(false);
        setShowBackendClassifyErrorNotification(false);
      }
    };
    handleDismissBackendErrorCall();
  }

  // Create states to track the selected Classifications for each row.
  const [selectedCategories, setSelectedCategories] = useState<
    Record<string, string>
  >({});
  const [selectedTaxCodes, setSelectedTaxCodes] = useState<
    Record<string, string>
  >({});

  // Updates the Classifications for each Transaction when the Classified Transactions or Classification results change.
  useEffect(() => {
    // Call the helper function to initalize the Classifications for the 'For Review' transactions.
    const handleInitalizeTransactionsCall = async () => {
      const initalizeResults =
        await initalizeLoadedTransactions(loadedTransactions);
      setSelectedCategories(initalizeResults.categoryRecord);
      setSelectedTaxCodes(initalizeResults.taxCodeRecord);
      setAccounts(initalizeResults.accountsList);
    };
    handleInitalizeTransactionsCall();
  }, [loadedTransactions]);

  // Update the selected Categories state using a 'For Review' transaction Id and the new Category.
  function handleCategoryChange(transactionId: string, category: string) {
    setSelectedCategories({
      ...selectedCategories,
      [transactionId]: category,
    });
  }
  // Update the selected Tax Code state using a 'For Review' transaction Id and the new Tax Code.
  function handleTaxCodeChange(transactionId: string, taxCode: string) {
    setSelectedTaxCodes({
      ...selectedTaxCodes,
      [transactionId]: taxCode,
    });
  }

  // Create states to track states of the transaction saving process indicating the state of the page.
  const [isSaving, setIsSaving] = useState(false);
  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [savingErrorMessage, setSavingErrorMessage] = useState<string>('');

  // Saves the selected Classification of the selected Rows.
  async function handleSave(
    selectedRows: Record<number, boolean>,
    transactions: (ClassifiedForReviewTransaction | ForReviewTransaction)[][]
  ) {
    // Set saving state to be true to lock review table actions.
    setIsSaving(true);

    // Call the save 'For Review' transactions function and track the returned success value.
    const savingResult = await saveSelectedTransactions(
      selectedRows,
      transactions,
      selectedCategories,
      selectedTaxCodes
    );

    // If the returned result was untrue, log an error message.
    if (!savingResult) {
      setSavingErrorMessage(
        'An error occurred while saving. Please try again.'
      );
    } else {
      // If saving was successful, set error message to be blank to overwrite any existing error messages.
      setSavingErrorMessage('');
    }

    // Update saving state on completion and show the saving completion modal.
    setIsSaving(false);
    setOpenSaveModal(true);
  }

  return (
    <>
      <h1
        id="PageAndCompanyName"
        className="mx-auto mb-4 text-center text-3xl font-bold">
        Classified Transactions -{' '}
        <span className="text-blue-900">{companyInfo.name}</span>
      </h1>

      <ManualReviewButton handleManualReview={handleManualClassification} />

      <h2 className="pb-4 text-center text-lg font-semibold">
        Next Scheduled Auto-Review: &nbsp;
        <span className="inline-block px-2 font-bold">
          {nextBackendClassifyDate}
        </span>
      </h2>

      {/* Populate the review table with the Categorized Transactions. */}
      <ReviewTable
        accountNames={accounts}
        categorizedTransactions={loadedTransactions}
        selectedCategories={selectedCategories}
        selectedTaxCodes={selectedTaxCodes}
        handleCategoryChange={handleCategoryChange}
        handleTaxCodeChange={handleTaxCodeChange}
        isSaving={isSaving}
        handleSave={handleSave}
      />

      {/* Defines the modal to be displayed if an attempt to load classified Transactions fails. */}
      {
        <ErrorLoadingTransactionsModal
          displayState={errorLoadingTransactions}
          setDisplayState={setErrorLoadingTransactions}
        />
      }

      {/* Defines a modal to be displayed on completion of the saving the Classified 'For Review' transactions. */}
      {
        <SaveClassifiedTransactionsModal
          displayState={openSaveModal}
          errorMessage={savingErrorMessage}
        />
      }

      {/* Defines the modal to be displayed during the manual Classification process. */}
      {
        <ManualClassifyProgessModal
          displayState={openManualClassificationModal}
          progressMessage={manualClassificationModalMessage}
          completedChunks={numCompletedProcesses}
          maxChunks={numManualClassificationStates}
        />
      }

      {/* Defines the modal to be displayed on completion of the manual Classification function call. */}
      {
        <ManualClassifyCompleteModal
          displayState={openFinishedClassificationModal}
          setDisplayState={setOpenFinishedClassificationModal}
          manualClassificationState={manualClassificationState}
        />
      }
    </>
  );
}
