'use client';

import { useEffect, useState } from 'react';

import { changeClassificationState } from '@/actions/classification/index';
import { getDatabaseTransactions } from '@/actions/db-review-transactions/index';

import {
  initalizeLoadedTransactions,
  saveSelectedTransactions,
  updateClassifyStates,
} from '@/actions/review-page-handlers/index';

import { ReviewTable } from '@/components/review-page/review-table';

import { ReviewButton } from '@/components/inputs/review-button';

import {
  ClassifyProgessModal,
  ClassifyCompleteModal,
  ErrorLoadingTransactionsModal,
  SaveClassifiedTransactionsModal,
} from '@/components/modals/index';

import type {
  CompanyInfo,
  RawForReviewTransaction,
  ClassifiedForReviewTransaction,
} from '@/types/index';

// Takes: A Company Info object and boolean indicating when the Company Info is loaded.
export default function ReviewPage({
  companyInfo,
}: Readonly<{
  companyInfo: CompanyInfo;
}>) {
  // Create states to track the loaded Transactions and their assosiated Accounts.
  const [loadedTransactions, setLoadedTransactions] = useState<
    (ClassifiedForReviewTransaction | RawForReviewTransaction)[][]
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
      console.log('Load Transactions');
      if (loadResult.queryResult.result === 'Error') {
        console.log(loadResult.queryResult.message);
        console.log(loadResult.queryResult.detail);
        // If an error was found, open the related error modal.
        setErrorLoadingTransactions(true);
      }
      console.log(loadResult.queryResult.result);
      console.log(loadResult.transactions);
      // Update the loaded Transactions state regardless of outcome. Array is set to be empty on error.
      setLoadedTransactions(loadResult.transactions);
    };
    loadForReviewTransactions();
  }, []);

  // Create states to track the states of a Classification process.
  const [classificationState, setClassificationState] = useState<string>('');
  const [openClassificationModal, setOpenClassificationModal] =
    useState<boolean>(false);
  const [openFinishedClassificationModal, setOpenFinishedClassificationModal] =
    useState<boolean>(false);

  // Define the helper function to start the Classification process.
  function handleClassification() {
    const handleClassify = async () => {
      // Calls the handler method to handle Classification and state setting.
      // Also returns the Classification results to be displayed.
      const classificationResults = await updateClassifyStates(
        setClassificationState
      );

      // Check if the Classification failed on loading Classified 'For Review' transactions.
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
    handleClassify();
  }

  // Create states used in the frontend display of the Classification state.
  const [classificationModalMessage, setClassificationModalMessage] =
    useState<string>('');
  const [numCompletedProcesses, setNumCompletedProcesses] = useState<number>(0);
  const numClassificationStates = 8;

  // Defines a handler for changes to the Classification state.
  useEffect(() => {
    const handleClassificationChangeCall = async () => {
      // Calls the handler method to await the new state values.
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
        setTimeout(() => {
          setOpenClassificationModal(false);
          setNumCompletedProcesses(0);
        }, 2000);
      }
    };
    handleClassificationChangeCall();
  }, [classificationState]);

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
      console.log('Initalize Transactions');
      const initalizeResults =
        await initalizeLoadedTransactions(loadedTransactions);
      console.log(initalizeResults.categoryRecord);
      console.log(initalizeResults.taxCodeRecord);
      console.log(initalizeResults.accountsList);
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
    transactions: (ClassifiedForReviewTransaction | RawForReviewTransaction)[][]
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

      <div className="mx-auto mb-6 w-fit rounded-lg border-2 border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100 p-6 shadow-lg transition-all duration-500 hover:scale-105 hover:shadow-2xl">
        <ReviewButton handleReview={handleClassification} />
      </div>

      <ReviewTable
        accountNames={accounts}
        classifiedTransactions={loadedTransactions}
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
        <ClassifyProgessModal
          displayState={openClassificationModal}
          progressMessage={classificationModalMessage}
          completedChunks={numCompletedProcesses}
          maxChunks={numClassificationStates}
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
