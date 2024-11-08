'use client';
import { useEffect, useState } from 'react';

import { manualClassify } from '@/actions/backend-actions/classification/manual-classify';
import {
  checkBackendClassifyError,
  dismissBackendClassifyError,
} from '@/actions/backend-actions/database-functions/backend-classify-failure';
import { addDatabaseTransactions } from '@/actions/db-transactions';
import { getDatabaseTransactions } from '@/actions/db-review-transactions/get-db-for-review';
import { removeForReviewTransactions } from '@/actions/db-review-transactions/remove-db-for-review';
import { addForReview } from '@/actions/quickbooks/add-for-review';
import { getAccounts } from '@/actions/quickbooks/get-accounts';
import { ReviewTable } from '@/components/data-table/review-table';
import {
  ManualClassifyProgessModal,
  ManualClassifyCompleteModal,
} from '@/components/modals/manual-classify-modals';
import {
  ErrorLoadingTransactionsModal,
  SaveClassifiedTransactionsModal,
} from '../modals/transaction-modals';
import type { Account } from '@/types/Account';
import type { ClassifiedElement } from '@/types/Classification';
import type { CompanyInfo } from '@/types/CompanyInfo';
import type {
  ForReviewTransaction,
  ClassifiedForReviewTransaction,
} from '@/types/ForReviewTransaction';
import type { Transaction } from '@/types/Transaction';

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
    // Create a date object and get the current day of the week in the UTC time zone.
    const date = new Date();
    const dayOfTheWeek = date.getUTCDay();

    // Determine the current number of days away from Saturday for this week.
    let daysUntilClassify = 6 - dayOfTheWeek;
    // Saturday and Sunday will result in a value less than one .
    if (daysUntilClassify < 1) {
      // Add 7 to the difference to get the number of days until next Saruday.
      daysUntilClassify += 7;
    }

    // Use the number of days until Saturday to get the UTC date of the next Classification.
    const nextClassifyUTC = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate() + daysUntilClassify
      )
    );

    // Update the state tracking the next Classification date value.
    // Using toString() converts from the UTC time to the local time zone of the user.
    setNextBackendClassifyDate(nextClassifyUTC.toString());
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
  const [numCompletedProcesses, setNumCompletedProcesses] = useState<number>(0);
  const numManualClassificationStates = 8;

  // Starts the manual Classification process, handles the intial and end states, and modal display on finish.
  function handleManualClassification() {
    // Set the Classification process to be in progress and update the state.
    setManualClassificationState('Start Classify');
    setIsClassifying(true);

    const startManualClassification = async () => {
      // Make call to backend 'For Review' Classification function with the method to update the Classification state.
      const success = await manualClassify(updateManualClassificationState);

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
    };

    // Start the Manual Classification by calling the async function.
    startManualClassification();
  }
  // Define a function to update the Manual Classification state.
  function updateManualClassificationState(newState: string) {
    setManualClassificationState(newState);
  }

  // Define handler for different manual Classification states.
  useEffect(() => {
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
        setManualClassificationModalMessage(
          'Classifying the new transactions.'
        );
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
    // Create a function to use async functions.
    const checkBackendClassifyErrorStatus = async () => {
      // Check the database Company object for a backend Classification error status.
      const errorCheckResponse = await checkBackendClassifyError();

      // Check for an error getting the backend Classification error status.
      if (errorCheckResponse.queryResult.result === 'Error') {
        // If check failed, assume no error status was logged.
        console.error(errorCheckResponse.queryResult.message);
        return;
      }

      // Check if an backend Classification error staus was recorded.
      if (errorCheckResponse.errorStatus) {
        // Update the error state and display the frontend element to inform the user.
        setBackendClassifyError(true);
        setShowBackendClassifyErrorNotification(true);
      }
    };
    // Call the helper function to check for backend Classification failure.
    checkBackendClassifyErrorStatus();
  }, [found_company_info]);

  // Updates the database Company object to dismiss backend Classification error.
  // Unused: Function is marked as unused until frontend notice that allows the user to dismiss the error is implemented.
  async function _dismissBackendClassifyErrorStatus() {
    // Update the database Company object to dismiss the backend Classification error status.
    const dismissErrorResponse = await dismissBackendClassifyError();

    // Check for an error dismissing the backend Classification error status.
    if (dismissErrorResponse.result === 'Error') {
      // If check failed, assume the error was not dismissed.
      setDismissResultMessage('Error');
      console.error(dismissErrorResponse.message);
    } else {
      // If the error status was dismissed successfuly, update the error status check states.
      setBackendClassifyError(false);
      setShowBackendClassifyErrorNotification(false);
      setDismissResultMessage('Success');
    }
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
    // Initialize the selected Classifications for each 'For Review' transaction.
    const initializeClassifications = async () => {
      const initialCategories: Record<string, string> = {};
      const initialTaxCodes: Record<string, string> = {};
      loadedTransactions.forEach((transaction) => {
        // Assert the formatted 'For Review' transaction type and extract its Classifications.
        const classifiedTransaction =
          transaction[0] as ClassifiedForReviewTransaction;
        const classifications: {
          categories: ClassifiedElement[] | null;
          taxCodes: ClassifiedElement[] | null;
        } = {
          categories: classifiedTransaction.categories,
          taxCodes: classifiedTransaction.taxCodes,
        };

        // Check if each of the Classifications are present.
        // If they are, set the inital Classification of that type for the 'For Review' transaction to the value in the first index.
        if (classifications.categories) {
          initialCategories[classifiedTransaction.transaction_Id] =
            classifications.categories[0].name;
        }
        if (classifications.taxCodes) {
          initialTaxCodes[classifiedTransaction.transaction_Id] =
            classifications.taxCodes[0].name;
        }
      });
      // Update the selected Categories and Tax Sodes state with the initial Classifications.
      setSelectedCategories(initialCategories);
      setSelectedTaxCodes(initialTaxCodes);
    };

    // Create a set to track Account names without duplicates, then add all Account names to the set.
    const accountNames = new Set<string>();
    for (const transaction of loadedTransactions) {
      const formattedTransaction =
        transaction[0] as ClassifiedForReviewTransaction;
      accountNames.add(formattedTransaction.account);
    }

    // Update the list of Accounts state with a list of unique Account names from the set.
    setAccounts(Array.from(accountNames));

    // Call method to initalize the Classifications of the 'For Review' transactions.
    initializeClassifications();
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
    // Set the saving in progress status to true.
    setIsSaving(true);

    try {
      // Define an array for Transactions to be saved to the database for future Classification use.
      const newTransactions: Transaction[] = [];

      // Call the list of Expense Accounts to get Account Id's from the recorded Account names.
      const accountResults = JSON.parse(await getAccounts('Expense'));

      // Initally set Accounts variable to be empty and update it if Accounts fetch was successful.
      let accounts = [];

      // Check if the Accounts fetch resulted in an error.
      if (accountResults[0].result === 'Error') {
        // If Accounts fetch failed, log an error message and throw an error to be caught and displayed.
        console.error('Error Fetching Accounts: ' + accountResults[0].message);
        throw 'Accounts Fetch Failed';
      } else {
        // Set the Accounts variable to the Account results with the Query Result in the first index removed.
        accounts = accountResults.slice(1);
      }

      // Get the selected Rows in an iterable format [key: selectedRowIndex, value: true]
      // The key is the index of the Row and the value is true for selected Rows.
      const selectedRowIndices = Object.entries(selectedRows);

      // Iterate through the selected Rows, using only values where selected = true.
      selectedRowIndices.forEach(async ([index, selected]) => {
        if (selected) {
          // Get the Row index as a number, as well as the Classified and Raw 'For Review' transaction objects.
          const numericalIndex = Number(index);
          const classifiedTransaction = transactions[
            numericalIndex
          ][0] as ClassifiedForReviewTransaction;
          const rawTransaction = transactions[
            numericalIndex
          ][1] as ForReviewTransaction;

          // Get the Id of the Transaction and use that to get its selected Classifications.
          const transactionId = classifiedTransaction.transaction_Id;
          const selectedCategory = selectedCategories[transactionId];
          const selectedTaxCode = selectedTaxCodes[transactionId];

          // Define inital null values for the Classification Category and Tax Code.
          let category = null;
          let taxCode = null;

          if (classifiedTransaction.categories) {
            // Get the Classified element related to the selected Category for the Transaction.
            category = classifiedTransaction.categories.find(
              (category) => category.name === selectedCategory
            ) as ClassifiedElement;
          }

          if (classifiedTransaction.taxCodes) {
            // Get the Classified element related to the selected Tax Code for the Transaction.
            taxCode = classifiedTransaction.taxCodes.find(
              (taxCode) => taxCode.name === selectedTaxCode
            ) as ClassifiedElement;
          }

          // Throw an error if the Id for that Transaction cannot be found.
          // Occurs if the selected Classification is not present in Classified 'For Review' transaction's Classifications.
          if (!category || !taxCode) {
            throw new Error('Error saving Purchase');
          } else {
            // Create a new Transaction object to be saved using the Classified Transaction and its Classifications.
            const newDatabaseTransaction: Transaction = {
              name: classifiedTransaction.name,
              amount: classifiedTransaction.amount,
              category: selectedCategory,
              taxCodeName: selectedTaxCode,
            };

            // Find what method was used to Classify the Transaction.
            const categoryClassificationMethod = category.classifiedBy;

            // If the Transaction was Classified by LLM, it still has the full Account name.
            if (categoryClassificationMethod === 'LLM') {
              // Find the Account related to that Category.
              const account = accounts.find(
                (account: Account) => account.name === category.name
              );

              // If the related Account exists, update the Category to use the sub-type of the Account instead.
              // Prevents possibility of saving user inputted Account names to the database.
              if (account) {
                newDatabaseTransaction.category = account.account_sub_type;
              } else {
                // If no match is found, throw an error.
                throw new Error('Error saving Purchase');
              }
            }

            // Push the new Transaction to the array of Transactions to be saved to the database.
            newTransactions.push(newDatabaseTransaction);

            // Call backend method to add the Classified 'For Review' Transaction to QuickBooks.
            const addResult = await addForReview(
              rawTransaction,
              category.id,
              taxCode.id
            );

            // If adding the new Transactions resulted in an error, throw the Query Result message as an error.
            if (addResult.result === 'Error') {
              throw addResult.message;
            }

            // Remove the related 'For Review' transaction and its connections from the database.
            const removeResult =
              await removeForReviewTransactions(rawTransaction);

            // If removing the Transaction resulted in an error, throw the Query Result message as an error.
            if (removeResult.result === 'Error') {
              throw removeResult.message;
            }
          }
        }
      });

      // Add all the newly created Transactions to the database.
      const result = await addDatabaseTransactions(newTransactions);
      // Check the Query Result if returned by the add Transactions function resulted in an error.
      if (result.result === 'Error') {
        // If the result was an error, log the message and detail and update the error message state.
        console.error(
          'Error saving existing Classified Transactions:',
          result.message,
          ', Detail: ',
          result.detail
        );
        setSavingErrorMessage(
          'An error occurred while saving. Please try again.'
        );
      }
      // If no errors occured, set the error message state to be null.
      await setSavingErrorMessage('');
    } catch (error) {
      // Catch any errors and log them (include the error message if it is present).
      if (error instanceof Error) {
        console.error('Error saving existing Classified Transactions:', error);
      } else {
        console.error('Error saving existing Classified Transactions:', error);
      }
      // On error, set the error message state.
      setSavingErrorMessage(
        'An error occurred while saving. Please try again.'
      );
    } finally {
      // Once the saving process is complete,
      // Set the saving in progress status to false and open the save result modal.
      setIsSaving(false);
      setOpenSaveModal(true);
    }
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
