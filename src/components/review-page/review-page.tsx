'use client';

import { useEffect, useState } from 'react';

import { changeClassificationState } from '@/actions/classification/index';
import { getDatabaseTransactions } from '@/actions/db-review-transactions/index';

import {
  initalizeLoadedTransactions,
  updateClassifyStates,
  saveSelectedTransactions,
} from '@/actions/review-page-handlers/index';

import { ReviewTable } from '@/components/review-page/review-table';

import { ReviewButton } from '@/components/inputs/review-button';

import {
  ClassifyProgessModal,
  ClassifyCompleteModal,
  ErrorLoadingTransactionsModal,
  SaveClassifiedTransactionsModal,
  SaveProcessModal,
  UndoSaveModal,
} from '@/components/modals/index';

import type {
  CompanyInfo,
  ClassifiedForReviewTransaction,
  RawForReviewTransaction,
} from '@/types/index';

// Takes: The Company Info.
export default function ReviewPage({
  companyInfo,
}: Readonly<{
  companyInfo: CompanyInfo;
}>) {
  // Define states to track if Transactions are loading and if it resulted in an error.
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(true);
  const [errorLoadingTransactions, setErrorLoadingTransactions] =
    useState<boolean>(false);

  // Define states to contain the loaded Transactions and the names of their Accounts.
  const [loadedTransactions, setLoadedTransactions] = useState<
    (ClassifiedForReviewTransaction | RawForReviewTransaction)[][]
  >([]);
  const [accounts, setAccounts] = useState<string[]>([]);

  // On page load, gets the previously Classified and saved Transactions.
  useEffect(() => {
    setLoadingTransactions(true);
    const loadForReviewTransactions = async () => {
      // Load the Transactions and check the Query Result for an error.
      const loadResult = await getDatabaseTransactions();
      if (loadResult.queryResult.result === 'Error') {
        // If an error was found, set the related error modal to be shown.
        setErrorLoadingTransactions(true);
      }
      // Update the loaded Transactions state regardless of outcome and set loading to be complete.
      // Array is set to be empty on error.
      setLoadedTransactions(loadResult.transactions);
      setLoadingTransactions(false);
    };
    loadForReviewTransactions();
  }, []);

  // Define states to track the current stage of the Classification process.
  const [classificationState, setClassificationState] = useState<string>('');

  // Define states to track if the Classification process and error modals should be shown.
  const [openClassificationModal, setOpenClassificationModal] =
    useState<boolean>(false);
  const [openFinishedClassificationModal, setOpenFinishedClassificationModal] =
    useState<boolean>(false);

  // Define the helper function to start the Classification process.
  function handleClassification() {
    const handleClassify = async () => {
      // Set the Classification process modal to be shown when starting the process.
      setOpenClassificationModal(true);

      // Call handler method for Classification and state setting, returns the Classification results.
      const classificationResults = await updateClassifyStates(
        setClassificationState
      );

      // Check if the Classification failed while loading Classified 'For Review' transactions.
      if (classificationResults.loadFailure) {
        // If failure to load occurred, show the error loading modal.
        setErrorLoadingTransactions(true);
      } else {
        // Otherwise the completion modal is shown which handles success state or error state.
        // Error state is shown when error was not caused by loading Classified 'For Review' transactions.
        setOpenFinishedClassificationModal(true);
      }
      // Update the Classified 'For Review' transaction states with returned values (or empty array on error).
      setLoadedTransactions(classificationResults.loadedTransactions);
    };
    handleClassify();
  }

  // Define states and values used in the frontend display of the Classification state.
  // The current process step message, the number of completed steps, and the constant number of steps.
  const [classificationModalMessage, setClassificationModalMessage] =
    useState<string>('');
  const [numCompletedProcesses, setNumCompletedProcesses] = useState<number>(0);
  const numClassificationStates = 8;

  // Defines a handler for changes to the Classification state.
  useEffect(() => {
    const handleClassificationChangeCall = async () => {
      // Handler gets the process stage message and stage number based on Classification state string.
      const processStates =
        await changeClassificationState(classificationState);

      // Set states with the Classification process values.
      setClassificationModalMessage(processStates.displayValue);
      setNumCompletedProcesses(processStates.currentProcess);

      // For end states (-1 / 8), update states to close the modal and reset the progess value.
      if (
        processStates.currentProcess === -1 ||
        processStates.currentProcess === 8
      ) {
        // Set timeout so error state is briefly visible before modal change.
        setTimeout(() => {
          setOpenClassificationModal(false);
          setNumCompletedProcesses(0);
        }, 2000);
      }
    };
    handleClassificationChangeCall();
  }, [classificationState]);

  // Define states to track the selected Classifications for each row.
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

  // Handlers to update the selected Classification states.
  // Takes the'For Review' transaction Id and the new Classification.
  function handleCategoryChange(transactionId: string, category: string) {
    setSelectedCategories({
      ...selectedCategories,
      [transactionId]: category,
    });
  }
  function handleTaxCodeChange(transactionId: string, taxCode: string) {
    setSelectedTaxCodes({
      ...selectedTaxCodes,
      [transactionId]: taxCode,
    });
  }

  // Create states to track the saving process values.
  // If saving is in progress, if the save complete modal is shown, if there is an error message to display.
  const [isSaving, setIsSaving] = useState(false);
  const [openSaveModal, setOpenSaveModal] = useState(false);
  const [savingErrorMessage, setSavingErrorMessage] = useState<string>('');

  // Define a callback to handle saving the selected Classification of the selected Rows.
  async function handleSave(
    selectedRows: Record<number, boolean>,
    transactions: (ClassifiedForReviewTransaction | RawForReviewTransaction)[][]
  ) {
    // Set saving state to true to prevent further review Table actions.
    setIsSaving(true);

    // Call the save 'For Review' transactions helper function.
    const savingResult = await saveSelectedTransactions(
      selectedRows,
      transactions,
      selectedCategories,
      selectedTaxCodes
    );

    // If the returned result was an error (false), log an error message.
    if (!savingResult) {
      setSavingErrorMessage(
        'An error occurred while saving. Please try again.'
      );
    } else {
      // If saving was successful, set error message to be blank to overwrite any existing error messages.
      setSavingErrorMessage('');
    }

    // Unset saving state on completion and show the save complete modal.
    setIsSaving(false);
    setOpenSaveModal(true);
  }

  // Define state used to display the undo last save modal.
  const [showUndoSaveModal, setShowUndoSaveModal] = useState(false);

  return (
    <>
      <h1 className="mx-auto mb-6 text-center text-4xl font-extrabold text-gray-800">
        Review Transactions -{' '}
        <span className="text-blue-700">{companyInfo.name}</span>
      </h1>

      <div className="mx-auto mb-6 w-fit rounded-lg border-2 border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100 p-6 shadow-lg transition-all duration-500 hover:scale-105 hover:shadow-2xl">
        <ReviewButton handleReview={handleClassification} />
      </div>

      <ReviewTable
        loadingTransactions={loadingTransactions}
        isSaving={isSaving}
        classifiedTransactions={loadedTransactions}
        accountNames={accounts}
        selectedCategories={selectedCategories}
        selectedTaxCodes={selectedTaxCodes}
        handleCategoryChange={handleCategoryChange}
        handleTaxCodeChange={handleTaxCodeChange}
        handleSave={handleSave}
        showUndoSaveModal={setShowUndoSaveModal}
      />

      {
        <ErrorLoadingTransactionsModal
          displayState={errorLoadingTransactions}
          setDisplayState={setErrorLoadingTransactions}
        />
      }

      {<SaveProcessModal displayState={isSaving} />}

      {
        <SaveClassifiedTransactionsModal
          displayState={openSaveModal}
          errorMessage={savingErrorMessage}
        />
      }

      {
        <UndoSaveModal
          displayState={showUndoSaveModal}
          setDisplayState={setShowUndoSaveModal}
        />
      }

      {
        <ClassifyProgessModal
          displayState={openClassificationModal}
          progressMessage={classificationModalMessage}
          maxChunks={numClassificationStates}
          completedChunks={numCompletedProcesses}
        />
      }

      {
        <ClassifyCompleteModal
          displayState={openFinishedClassificationModal}
          setDisplayState={setOpenFinishedClassificationModal}
          classificationState={classificationState}
        />
      }
    </>
  );
}
