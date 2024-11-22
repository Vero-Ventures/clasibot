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

import { BackendClassifyErrorNotice } from '@/components/review-page-components/index';
import { ReviewTable } from '@/components/review-page/review-table';

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

  // On page load, gets the previously Classified and saved Transactions whenever Company Info loading state updates.
  useEffect(() => {
    // Load the Transactions from the database.
    const loadForReviewTransactions = async () => {
      // Load the Transactions and check the Query Result for an error.
      const loadResult = await getDatabaseTransactions();
      if (loadResult.queryResult.result === 'Error') {
        // If an error was found, open the related error modal.
        // setErrorLoadingTransactions(true);
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
  const [openFinishedClassificationModal, setOpenFinishedClassificationModal] =
    useState<boolean>(false);

  // Define the helper function to start the manual Classification process.
  // Also handles the intial and end state setting and displays a modal on completion.
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

  // Create states used in the frontend display of the manual Classification state.
  const [
    manualClassificationModalMessage,
    setManualClassificationModalMessage,
  ] = useState<string>('');
  const [numCompletedProcesses, setNumCompletedProcesses] = useState<number>(0);
  const numManualClassificationStates = 8;

  // Defines a handler for changes to the manual Classification state.
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
  const [showErrorNotice, setShowErrorNotice] = useState<boolean>(false);

  // On page load, check the database for an error notice from backend Classification.
  useEffect(() => {
    // Call the helper function to check for backend Classification failure.
    const handleCheckBackendErrorCall = async () => {
      const foundError = await checkBackendClassifyError();
      // Set the found error state based on the found error value.
      setShowErrorNotice(foundError.errorStatus);
    };
    handleCheckBackendErrorCall();
  }, []);

  // Defines a callback to dismiss backend Classification error the database and hide the error notice.
  async function dismissErrorStatus() {
    const handleDismissBackendErrorCall = async () => {
      // Close the frontend element, then dismiss the error from the database Company object.
      await dismissBackendClassifyError();
      setShowErrorNotice(false);
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

  // Whenever the loaded 'For Review' transactions are updated, also update the Classifications for each Transaction.
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

  // Define a callback to handle saving the selected Classification of the selected Rows.
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
      <h1 className="mx-auto mb-6 text-center text-4xl font-extrabold text-gray-800">
        Review Transactions -{' '}
        <span className="text-blue-700">{companyInfo.name}</span>
      </h1>

      {/* Manual Review Button Section */}
      <div className="mx-auto mb-6 w-fit rounded-lg border-2 border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100 p-6 shadow-lg transition-transform duration-500 hover:scale-105 hover:shadow-2xl">
        <ManualReviewButton handleManualReview={handleManualClassification} />
        <h2 className="mt-6 w-full px-6 text-center text-lg font-medium text-gray-600 sm:px-2">
          Next Scheduled Auto-Review
          <span className="mt-2 block rounded bg-blue-100 px-4 py-1 font-bold text-blue-800 sm:ml-4 sm:mt-0 sm:inline-block">
            {nextBackendClassifyDate}
          </span>
        </h2>
      </div>

      <div className="mx-auto w-fit">
        <BackendClassifyErrorNotice
          showErrorNotice={showErrorNotice}
          dismissErrorStatus={dismissErrorStatus}
        />
      </div>

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

      {
        <ErrorLoadingTransactionsModal
          displayState={errorLoadingTransactions}
          setDisplayState={setErrorLoadingTransactions}
        />
      }

      {
        <SaveClassifiedTransactionsModal
          displayState={openSaveModal}
          errorMessage={savingErrorMessage}
        />
      }

      {
        <ManualClassifyProgessModal
          displayState={openManualClassificationModal}
          progressMessage={manualClassificationModalMessage}
          completedChunks={numCompletedProcesses}
          maxChunks={numManualClassificationStates}
        />
      }

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
