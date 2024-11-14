'use client';

import { useEffect, useState } from 'react';

import { changeManualClassificationState } from '@/actions/backend-actions/classification/index';
import { getDatabaseTransactions } from '@/actions/db-review-transactions/index';

import {
  checkBackendClassifyErrorStatus,
  dismissBackendClassifyErrorStatus,
  getNextReviewDate,
  handleStateForManualClassify,
  initalizeLoadedTransactions,
  saveSelectedTransactions,
} from '@/actions/review-page-handlers/index';

import { ReviewTable } from '@/components/data-table/review-table';

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
  company_info,
  found_company_info,
}: Readonly<{
  company_info: CompanyInfo;
  found_company_info: boolean;
}>) {
  // Define state to track the localized time of the next backend Classification.
  const [_nextBackendClassifyDate, setNextBackendClassifyDate] =
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
      if (loadResult[0].result === 'Error') {
        // If an error was found, open the related error modal.
        setErrorLoadingTransactions(true);
      }
      // Update the loaded Transactions state regardless of outcome. Array is set to be empty on error.
      setLoadedTransactions(loadResult[1]);
    };
    loadForReviewTransactions();
  }, [found_company_info]);

  // Create states to track the states of a Manual Classification process.
  const [isClassifying, setIsClassifying] = useState(false);
  const [manualClassificationState, setManualClassificationState] =
    useState<string>('');
  const [openFinishedClassificationModal, setOpenFinishedClassificationModal] =
    useState<boolean>(false);
  const [openManualClassificationModal, setOpenManualClassificationModal] =
    useState<boolean>(false);
  const [
    manualClassificationModalMessage,
    setManualClassificationModalMessage,
  ] = useState<string>('');

  // Starts the manual Classification process, handles the intial and end states, and modal display on finish.
  function handleManualClassification() {
    // Start the manual Classification process.
    setIsClassifying(true);

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

      // Complete process by setting isClassifying state to false.
      setIsClassifying(false);
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
      setManualClassificationModalMessage(processStates[0]);
      setNumCompletedProcesses(processStates[1]);

      // For end states (-1 / 8), update states to close the modal and reset the progess value.
      if (processStates[1] === -1 || processStates[1] === 8) {
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
      const foundError = await checkBackendClassifyErrorStatus();
      // Set the found error and display error notice state based on the found error value.
      setBackendClassifyError(foundError);
      setShowBackendClassifyErrorNotification(foundError);
    };
    handleCheckBackendErrorCall();
  }, [found_company_info]);

  // Updates the database Company object to dismiss backend Classification error.
  // Unused: Function is marked as unused until frontend notice that allows the user to dismiss the error is implemented.
  async function _dismissBackendClassifyErrorStatus() {
    // Calls the handler method to await the new state values.
    const handleDismissBackendErrorCall = async () => {
      const dissmissResult = await dismissBackendClassifyErrorStatus();
      // Set the display message and error tracking states based on the dismissal result.
      if (dissmissResult) {
        // Set to be display to hidden on success and sets the found error state to false.
        setDismissResultMessage('Success');
        setBackendClassifyError(false);
        setShowBackendClassifyErrorNotification(false);
      } else {
        // On error, update indicator state and leave other states unchanged.
        setDismissResultMessage('Error');
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
    const handleInitalizeTransactionsCall = async () => {
      const initalizeResults =
        await initalizeLoadedTransactions(loadedTransactions);
      setSelectedCategories(initalizeResults[0]);
      setSelectedTaxCodes(initalizeResults[1]);
      setAccounts(initalizeResults[2]);
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
    saveSelectedTransactions(
      selectedRows,
      transactions,
      selectedCategories,
      selectedTaxCodes,
      setIsSaving,
      setSavingErrorMessage,
      setOpenSaveModal
    );
  }

  return (
    <>
      <h1
        id="PageAndCompanyName"
        className="m-auto mb-4 text-center text-3xl font-bold">
        Classified Transactions -&nbps;
        <span className="text-blue-900">{company_info.name}</span>
      </h1>
      {/* Populate the review table with the Categorized Transactions. */}
      <ReviewTable
        categorizedTransactions={loadedTransactions}
        selectedCategories={selectedCategories}
        selectedTaxCodes={selectedTaxCodes}
        account_names={accounts}
        handleCategoryChange={handleCategoryChange}
        handleTaxCodeChange={handleTaxCodeChange}
        handleSave={handleSave}
        isSaving={isSaving}
        handleManualClassification={handleManualClassification}
        isClassifying={isClassifying}
        manualClassificationState={manualClassificationState}
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
