'use client';
import { useEffect, useState } from 'react';

import { getDatabaseTransactions } from '@/actions/db-review-transactions/get-db-for-review';
import {
  checkBackendClassifyErrorStatus,
  dismissBackendClassifyErrorStatus,
} from '@/actions/review-page-handlers/backend-classify-error';
import { getNextReviewDate } from '@/actions/review-page-handlers/next-review-date';
import { initalizeLoadedTransactions } from '@/actions/review-page-handlers/initalize-transactions';
import { saveSelectedTransactions } from '@/actions/review-page-handlers/save-transactions';
import {
  startManualClassification,
  changeManualClassificationState,
} from '@/actions/review-page-handlers/start-manual-classify';

import { ReviewTable } from '@/components/data-table/review-table';
import {
  ManualClassifyProgessModal,
  ManualClassifyCompleteModal,
} from '@/components/modals/manual-classify-modals';
import {
  ErrorLoadingTransactionsModal,
  SaveClassifiedTransactionsModal,
} from '@/components/modals/transaction-modals';

import type { CompanyInfo } from '@/types/CompanyInfo';
import type {
  ForReviewTransaction,
  ClassifiedForReviewTransaction,
} from '@/types/ForReviewTransaction';

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
    getNextReviewDate(setNextBackendClassifyDate);
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
    // Start the Manual Classification by calling the async handler action.
    startManualClassification(
      setManualClassificationState,
      setIsClassifying,
      setErrorLoadingTransactions,
      setOpenFinishedClassificationModal,
      setLoadedTransactions
    );
  }

  const [numCompletedProcesses, setNumCompletedProcesses] = useState<number>(0);
  const numManualClassificationStates = 8;
  // Define handler for different manual Classification states.
  useEffect(() => {
    changeManualClassificationState(
      manualClassificationState,
      setManualClassificationModalMessage,
      setOpenManualClassificationModal,
      setNumCompletedProcesses
    );
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
    checkBackendClassifyErrorStatus(
      setBackendClassifyError,
      setShowBackendClassifyErrorNotification
    );
  }, [found_company_info]);

  // Updates the database Company object to dismiss backend Classification error.
  // Unused: Function is marked as unused until frontend notice that allows the user to dismiss the error is implemented.
  async function _dismissBackendClassifyErrorStatus() {
    dismissBackendClassifyErrorStatus(
      setDismissResultMessage,
      setBackendClassifyError,
      setShowBackendClassifyErrorNotification
    );
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
    initalizeLoadedTransactions(
      loadedTransactions,
      setSelectedCategories,
      setSelectedTaxCodes,
      setAccounts
    );
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
        Classified Transactions -{' '}
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
