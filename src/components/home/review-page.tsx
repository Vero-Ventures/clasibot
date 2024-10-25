'use client';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { manualClassify } from '@/actions/backend-actions/classification/manual-classify';
import { addTransactions } from '@/actions/db-transactions';
import { getDatabaseTransactions } from '@/actions/db-review-transactions/get-db-for-review';
import { removeForReviewTransactions } from '@/actions/db-review-transactions/remove-db-for-review';
import { addForReview } from '@/actions/quickbooks/add-for-review';
import { getAccounts } from '@/actions/quickbooks/get-accounts';
import { ReviewTable } from '@/components/data-table/review-table';
import { Button } from '@/components/ui/button';
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
  // Create states to track the selected Classifications for each row.
  const [selectedCategories, setSelectedCategories] = useState<
    Record<string, string>
  >({});
  const [selectedTaxCodes, setSelectedTaxCodes] = useState<
    Record<string, string>
  >({});

  // Create states to track the loaded Transactions and their assosiated Accounts.
  const [loadedTransactions, setLoadedTransactions] = useState<
    (ForReviewTransaction | ClassifiedForReviewTransaction)[][]
  >([]);
  const [accounts, setAccounts] = useState<string[]>([]);

  // Create states to track values indicating the state of the page.
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create states to track the state of a Manual Classification call.
  const [isClassifying, setIsClassifying] = useState(false);
  const [manualClassificationState, setManualClassificationState] =
    useState<string>('');
  const [openFinishedClassificationModal, setOpenFinishedClassificationModal] =
    useState<boolean>(false);

  // Define a function to update the Manual Classification state.
  function updateManualClassificationState(newState: string) {
    setManualClassificationState(newState);
  }

  function handleManualClassification() {
    // Set the Classification process to be in progress and update the state.
    setManualClassificationState('Starting Classification ...');
    setIsClassifying(true);

    const startManualClassification = async () => {
      // Make call to backend 'For Review' Classification function with the method to update the Classification state.
      const success = await manualClassify(updateManualClassificationState);
      if (success) {
        // Update the state to indicate the Classification is finished.
        setManualClassificationState(
          'Finished Review, Loading Transactions ...'
        );
        // Load the newly Classified 'For Review' transactions from the database after the manual Classification.
        setLoadedTransactions(await getDatabaseTransactions());

        // Update manual Classification state with a completion message.
        setManualClassificationState('Manual Classification Complete.');

        // Additional actions to perform on manual Classification completion.
        // Completion state handling.
        //
        //
        //
      } else {
        // Actions to preform in the event manual Classification results in an error.
        // Failure state handling.
        //
        //
        //
      }

      // Update the state to indicate Classification is no longer in progress and open a pop-up to inform the user.
      setIsClassifying(false);
      setOpenFinishedClassificationModal(true);
    };

    // Start the Manual Classification by calling the async function.
    startManualClassification();
  }

  // Loads the previously Classified and saved Transactions whenever Company Info loading state updates.
  useEffect(() => {
    // Load the transactions from the database.
    const loadForReviewTransactions = async () => {
      setLoadedTransactions(await getDatabaseTransactions());
    };
    loadForReviewTransactions();
  }, [found_company_info]);

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
          initialCategories[classifiedTransaction.transaction_ID] =
            classifications.categories[0].name;
        }
        if (classifications.taxCodes) {
          initialTaxCodes[classifiedTransaction.transaction_ID] =
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

  // Update the selected Categories state using a 'For Review' transaction ID and the new Category.
  function handleCategoryChange(transactionID: string, category: string) {
    setSelectedCategories({
      ...selectedCategories,
      [transactionID]: category,
    });
  }
  // Update the selected Tax Code state using a 'For Review' transaction ID and the new Tax Code.
  function handleTaxCodeChange(transactionID: string, taxCode: string) {
    setSelectedTaxCodes({
      ...selectedTaxCodes,
      [transactionID]: taxCode,
    });
  }

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

      // Call the list of Expense Accounts to get Account ID's from the recorded Account names.
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

          // Get the ID of the Transaction and use that to get its selected Classifications.
          const transactionID = classifiedTransaction.transaction_ID;
          const selectedCategory = selectedCategories[transactionID];
          const selectedTaxCode = selectedTaxCodes[transactionID];

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

          // Throw an error if the ID for that Transaction cannot be found.
          // Occurs if the selected Classification is not present in Classified 'For Review' transaction's Classifications.
          if (!category || !taxCode) {
            throw new Error('Error saving purchase');
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
                throw new Error('Error saving purchase');
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
      const result = await addTransactions(newTransactions);
      // Check the Query Result if returned by the add Transactions function resulted in an error.
      if (result.result === 'Error') {
        // If the result was an error, log the message and detail and update the error message state.
        console.error(
          'Error saving existing classified transactions:',
          result.message,
          ', Detail: ',
          result.detail
        );
        setErrorMsg('An error occurred while saving. Please try again.');
      }
      // If no errors occured, set the error message state to be null.
      await setErrorMsg(null);
    } catch (error) {
      // Catch any errors and log them (include the error message if it is present).
      if (error instanceof Error) {
        console.error('Error saving existing classified transactions:', error);
      } else {
        console.error('Error saving existing classified transactions:', error);
      }
      // On error, set the error message state.
      setErrorMsg('An error occurred while saving. Please try again.');
    } finally {
      // Once the saving process is complete,
      // Set the saving in progress status to false and open the save result modal.
      setIsSaving(false);
      setIsModalOpen(true);
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
        account_names={accounts}
        handleCategoryChange={handleCategoryChange}
        handleTaxCodeChange={handleTaxCodeChange}
        handleSave={handleSave}
        isSaving={isSaving}
        handleManualClassification={handleManualClassification}
        isClassifying={isClassifying}
        manualClassificationState={manualClassificationState}
      />

      {/* Only display result modal after an attempt to save sets 'modal open' state to true. */}
      <div
        className={`fixed left-0 top-0 flex h-full w-full items-center justify-center bg-gray-900 bg-opacity-50 ${isModalOpen ? '' : 'hidden'}`}>
        <div className="mx-4 w-96 rounded-lg bg-white p-6">
          {/* If an error is present, display an error message in the modal. */}
          {errorMsg ? (
            <>
              <h2
                id="ResultTitle"
                className="mb-4 text-center text-2xl font-bold text-red-500">
                Error
              </h2>
              <p
                id="ResultMessage"
                className="mb-6 text-center font-medium text-gray-800">
                {errorMsg}
              </p>
            </>
          ) : (
            // If no error is present, display a success message in the modal instead.
            <>
              <h2
                id="ResultTitle"
                className="mb-4 text-center text-2xl font-bold text-green-500">
                Success
              </h2>
              <p
                id="ResultMessage"
                className="mb-6 text-center font-medium text-gray-800">
                Transactions have been saved.
              </p>
            </>
          )}

          {/* Define button to return with text based on the error message state. */}
          <div id="ReturnButtonContainer" className="flex justify-center gap-4">
            <Button
              id="ReturnButton"
              className="h-12 w-40 rounded bg-blue-500 px-4 py-4 text-center font-bold text-white hover:bg-blue-600"
              onClick={() => {
                const url = window.location.origin + window.location.pathname;
                window.location.href = url;
              }}>
              <span className="whitespace-normal">
                {errorMsg
                  ? 'Retry Transaction Selection'
                  : 'Review Additional Transactions'}
              </span>
            </Button>
            {/* Define button to finish the session by logging the user out. */}
            <Button
              id="SignOutButton"
              className="h-12 w-40 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
              onClick={() => signOut({ callbackUrl: '/' })}>
              Finish Review Session
            </Button>
          </div>
        </div>
      </div>

      {/* Defines a popup to be displayed on completion of the manual Classification function call. */}
      <div
        className={`fixed left-0 top-0 flex h-full w-full items-center justify-center bg-gray-900 bg-opacity-50 ${openFinishedClassificationModal ? '' : 'hidden'}`}>
        <div className="mx-4 w-96 rounded-lg bg-white p-6">
          <>
            <h2
              id="ResultTitle"
              className="mb-4 text-center text-2xl font-bold text-green-500">
              Success
            </h2>
            <p
              id="ResultMessage"
              className="mb-6 text-center font-medium text-gray-800">
              Your transactions have been classified.
            </p>
          </>
          <div id="ReturnButtonContainer" className="flex justify-center gap-4">
            <Button
              id="CloseButton"
              className="h-12 w-40 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
              onClick={() => setOpenFinishedClassificationModal(false)}>
              Continue
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
