'use client';
import { useEffect, useState } from 'react';
import { manualReview } from '@/actions/backend-classification/classify-company';
import { addTransactions } from '@/actions/db-transactions';
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
import { getDatabaseTransactions } from '@/actions/db-review-transactions/get-db-for-review';
import { signOut } from 'next-auth/react';

export default function ReviewPage({
  company_info,
  found_company_info,
}: Readonly<{
  company_info: CompanyInfo;
  found_company_info: boolean;
}>) {
  // Create states to track and set the important values for classification.
  const [selectedCategories, setSelectedCategories] = useState<
    Record<string, string>
  >({});
  const [selectedTaxCodes, setSelectedTaxCodes] = useState<
    Record<string, string>
  >({});

  // Set states to track the transactions fetched to display to the user.
  const [loadedTransactions, setLoadedTransactions] = useState<
    (ForReviewTransaction | ClassifiedForReviewTransaction)[][]
  >([]);

  // Create a state to track the accounts present in the transactions for filtering purposes.
  const [accounts, setAccounts] = useState<string[]>([]);

  // Create states to track values related to the state of the page.
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create states to track values related to the state of a manual review.
  const [isReviewing, setIsReviewing] = useState(false);
  const [manualReviewState, setManualReviewState] = useState<string>('');

  // Make function to pass to update the manual review state.
  function updateManualReviewState(newState: string) {
    setManualReviewState(newState);
  }

  function handleManualReview() {
    // Define the review process as started and update the review state.
    setManualReviewState('Starting Review ...');
    setIsReviewing(true);

    const startManualReview = async () => {
      // Make call to backend for review function with the related states.
      manualReview(updateManualReviewState);
      // Update the state to indicate the review is finished and begin loading the newly reviewed transactions.
      setManualReviewState('Finished Review, Loading Transactions ...');
      // Load the transactions from the database after the manual review.
      setLoadedTransactions(await getDatabaseTransactions());
      // Update manual review state with a finished message.
      setManualReviewState('Manual Review Complete.');
      // Update the state to indicate review is not longer in progress.
      setIsReviewing(false);
    };
    
    // Start the manual review by calling the async function.
    startManualReview();
  }

  // Updates the categorizations for each transaction when categorized transactions or categorization results change.
  useEffect(() => {
    // Load the transactions from the database.
    const loadForReviewTransactions = async () => {
      setLoadedTransactions(await getDatabaseTransactions());
    };
    loadForReviewTransactions();
  }, [found_company_info]);

  // Updates the categorizations for each transaction when categorized transactions or categorization results change.
  useEffect(() => {
    // Initialize the selected classifications for each transaction.
    const initializeClassifications = async () => {
      const initialCategories: Record<string, string> = {};
      const initialTaxCodes: Record<string, string> = {};
      loadedTransactions.forEach((transaction) => {
        // Assert the formatted transaction and extract its classifications.
        const classifiedTransaction =
          transaction[0] as ClassifiedForReviewTransaction;
        // Assert the type of the non-error categorizations.
        const classifications: {
          categories: ClassifiedElement[] | null;
          taxCodes: ClassifiedElement[] | null;
        } = {
          categories: classifiedTransaction.categories,
          taxCodes: classifiedTransaction.taxCodes,
        };

        // Check if each classification is present and set them to the first value if they are.
        if (classifications.categories) {
          initialCategories[classifiedTransaction.transaction_ID] =
            classifications.categories[0].name;
        }

        if (classifications.taxCodes) {
          initialTaxCodes[classifiedTransaction.transaction_ID] =
            classifications.taxCodes[0].name;
        }
      });
      // Update the selected categories and tax codes state with the initial categories.
      setSelectedCategories(initialCategories);
      setSelectedTaxCodes(initialTaxCodes);
    };

    // Create a set to track account names without duplicates, then add all account names to the set.
    const accountNames = new Set<string>();
    for (const transaction of loadedTransactions) {
      const formattedTransaction =
        transaction[0] as ClassifiedForReviewTransaction;
      accountNames.add(formattedTransaction.account);
    }

    // Update the accounts state with a list of unique account names.
    setAccounts(Array.from(accountNames));

    // Call method to initalize the classifications of the transactions.
    initializeClassifications();
  }, [loadedTransactions]);

  // Update the selected categories state using a transaction ID and the new category.
  function handleCategoryChange(transactionID: string, category: string) {
    setSelectedCategories({
      ...selectedCategories,
      [transactionID]: category,
    });
  }

  // Update the selected tax code state using a transaction ID and the new tax code.
  function handleTaxCodeChange(transactionID: string, taxCode: string) {
    setSelectedTaxCodes({
      ...selectedTaxCodes,
      [transactionID]: taxCode,
    });
  }

  // Saves the selected categories using the selected rows.
  async function handleSave(
    selectedRows: Record<number, boolean>,
    transactions: (ClassifiedForReviewTransaction | ForReviewTransaction)[][]
  ) {
    // Set the saving status to true.
    setIsSaving(true);
    try {
      // Define an array for transactions to be saved to the database at the end for future classification use.
      const newTransactions: Transaction[] = [];
      // Call the list of expense accounts to get account ID's from using account names.
      const accounts = JSON.parse(await getAccounts('Expense'));
      // Get the selected rows in an iterable format [key: selectedRowIndex, value: true]
      // The key is the index of the row and the value is always true for selected rows.
      const selectedRowIndices = Object.entries(selectedRows);

      // Iterate through the selected rows, using only values where selected = true.
      selectedRowIndices.forEach(async ([index, selected]) => {
        if (selected) {
          // Get the row index as a number, as well as the catagoried and raw "for review" transaction objects.
          const numericalIndex = Number(index);
          const categorizedTransaction = transactions[
            numericalIndex
          ][0] as ClassifiedForReviewTransaction;
          const rawTransaction = transactions[
            numericalIndex
          ][1] as ForReviewTransaction;
          // Get the ID of the transaction and use that to get its selected classifications.
          const transactionID = categorizedTransaction.transaction_ID;
          const selectedCategory = selectedCategories[transactionID];
          const selectedTaxCode = selectedTaxCodes[transactionID];

          // Define inital null values for the classification category and tax code.
          let category = null;
          let taxCode = null;

          if (categorizedTransaction.categories) {
            // Get the classified element related to the selected category for the transaction.
            category = categorizedTransaction.categories.find(
              (category) => category.name === selectedCategory
            ) as ClassifiedElement;
          }

          if (categorizedTransaction.taxCodes) {
            // Get the classified element related to the selected category for the transaction.
            taxCode = categorizedTransaction.taxCodes.find(
              (taxCode) => taxCode.name === selectedTaxCode
            ) as ClassifiedElement;
          }

          // Throw an error if the ID for that transaction cannot be found.
          // Occurs if the selected category is not present in catagorized transaction.
          if (!category || !taxCode) {
            throw new Error('Error saving purchase');
          } else {
            // Create a new transaction object to be saved based on the selected category and catagoried transaction.
            const newDatabaseTransaction: Transaction = {
              name: categorizedTransaction.name,
              amount: categorizedTransaction.amount,
              category: selectedCategory,
              taxCodeName: selectedTaxCode,
            };

            // Find what method was used to classify the transaction.
            const categoryClassificationMethod = category.classifiedBy;

            // If the transaction was classified by LLM, it will be using the full account name.
            if (categoryClassificationMethod === 'LLM') {
              // Find the acount related to that categorization.
              const account = accounts.find(
                (account: Account) => account.name === category.name
              );
              // If the related account exists, update the category name to use the account sub-type instead.
              // Prevents possibility of saving user inputted account names to the database.
              if (account) {
                newDatabaseTransaction.category = account.account_sub_type;
              }
            }

            // Push the new transaction with savable info to array of transactions to be saved to the database.
            newTransactions.push(newDatabaseTransaction);

            // Call the method to login to backend as synthetic bookkeeper and add the classified transaction to the users account/
            await addForReview(
              rawTransaction,
              category.id,
              taxCode.id,
              '',
              '',
              ''
            );
            // Remove the related for review transaction and its connectionss from the database.
            const result = await removeForReviewTransactions(rawTransaction);
            // If the removal of transactions result is not successful, throw the detail as an error.
            if (result.result !== 'Success') {
              throw result.detail;
            }
          }
        }
      });
      // Add all the newly created savable transactions to the database and set no error message to appear.
      await addTransactions(newTransactions);
      await setErrorMsg(null);
    } catch (error) {
      // Catch any errors, log them, and set the error message.
      console.error('Error saving categories:', error);
      setErrorMsg('An error occurred while saving. Please try again.');
    } finally {
      // Once the saving process is complete, set the saving status to false and open the result modal.
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
      {/* Populate the review table with the categorized transactions. */}
      <ReviewTable
        categorizedTransactions={loadedTransactions}
        selectedCategories={selectedCategories}
        account_names={accounts}
        handleCategoryChange={handleCategoryChange}
        handleTaxCodeChange={handleTaxCodeChange}
        handleSave={handleSave}
        isSaving={isSaving}
        handleManualReview={handleManualReview}
        manualReviewState={manualReviewState}
        isReviewing={isReviewing}
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

          <div id="ReturnButtonContainer" className="flex justify-center gap-4">
            <Button
              id="ReturnButton"
              className="h-12 w-40 rounded bg-blue-500 px-4 py-4 text-center font-bold text-white hover:bg-blue-600"
              onClick={() => {
                const url = window.location.origin + window.location.pathname;
                window.location.href = url;
              }}>
              <span className="whitespace-normal">
                Review Additional Transactions
              </span>
            </Button>
            <Button
              id="SignOutButton"
              className="h-12 w-40 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
              onClick={() => signOut({ callbackUrl: '/' })}>
              Finish Review Session
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
