'use client';
import { useEffect, useState } from 'react';
import { addTransactions } from '@/actions/transaction-database';
import { addForReview } from '@/actions/quickbooks/add-for-review';
import { getAccounts } from '@/actions/quickbooks/get-accounts';
import { Button } from '@/components/ui/button';
import { ReviewTable } from '@/components/data-table/review-table';
import type { Account } from '@/types/Account';
import type { ClassifiedElement } from '@/types/Classification';
import type { CompanyInfo } from '@/types/CompanyInfo';
import type {
  ForReviewTransaction,
  CategorizedForReviewTransaction,
} from '@/types/ForReviewTransaction';
import type { Transaction } from '@/types/Transaction';

// Takes a list of categorized transactions, a record with the categorization results, and the company name.
export default function ReviewPage({
  categorizedTransactions,
  categorizationResults,
  company_info,
}: Readonly<{
  categorizedTransactions: (
    | CategorizedForReviewTransaction
    | ForReviewTransaction
  )[][];
  categorizationResults:
    | Record<
        string,
        {
          category: ClassifiedElement[] | null;
          taxCode: ClassifiedElement[] | null;
        }
      >
    | { error: string };
  company_info: CompanyInfo;
}>) {
  // Create states to track and set the important values.
  // Selected categories for each transaction, the saving status, and the modal status, an error message, and account names.
  const [selectedCategories, setSelectedCategories] = useState<
    Record<string, string>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<string[]>([]);

  // Updates the categorizations for each transaction when categorized transactions or categorization results change.
  useEffect(() => {
    // Initialize the selected categories for each transaction.
    const initializeCategories = async () => {
      const initialCategories: Record<string, string> = {};
      categorizedTransactions.forEach((transaction) => {
        const formattedTransaction =
          transaction[0] as CategorizedForReviewTransaction;
        // Look for the first category in the categorization results.
        const firstCategory =
          categorizationResults[formattedTransaction.transaction_ID]?.[0]?.name;
        // If a category is found, add it to the initial categories record.
        if (firstCategory) {
          initialCategories[formattedTransaction.transaction_ID] =
            firstCategory;
        }
      });
      // Update the selected categories state with the initial categories.
      setSelectedCategories(initialCategories);
    };

    // Create a set to track account names without duplicates, then add all account names to the set.
    const accountNames = new Set<string>();
    for (const transaction of categorizedTransactions) {
      const formattedTransaction =
        transaction[0] as CategorizedForReviewTransaction;
      accountNames.add(formattedTransaction.account);
    }

    // Update the accounts state with a list of unique account names.
    setAccounts(Array.from(accountNames));

    initializeCategories();
  }, [categorizedTransactions, categorizationResults]);

  // Update the selected categories state using a transaction ID and the new category.
  function handleCategoryChange(transactionID: string, category: string) {
    setSelectedCategories({
      ...selectedCategories,
      [transactionID]: category,
    });
  }

  // Saves the selected categories using the selected rows.
  async function handleSave(
    selectedRows: Record<number, boolean>,
    transactions: (CategorizedForReviewTransaction | ForReviewTransaction)[][]
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
          ][0] as CategorizedForReviewTransaction;
          const rawTransaction = transactions[
            numericalIndex
          ][1] as ForReviewTransaction;
          // Get the ID of the transaction and use that to get its selected category.
          const transactionID = categorizedTransaction.transaction_ID;
          const selectedCategory = selectedCategories[transactionID];
          // Get the ID related to the selected category for the transaction.
          const accountID = categorizedTransaction.categories.find(
            (category) => category.name === selectedCategory
          )?.id;

          // Throw an error if the ID for that transaction cannot be found.
          // Occurs if the selected category is not present in catagorized transaction.
          if (!accountID) {
            throw new Error('Error saving purchase');
          } else {
            // Create a new transaction object to be saved based on the selected category and catagoried transaction.
            const newDatabaseTransaction: Transaction = {
              name: categorizedTransaction.name,
              amount: categorizedTransaction.amount,
              category: selectedCategory,
            };

            // Find what method was used to classify the transaction.
            const classificationMethod = categorizedTransaction.categories.find(
              (category) => category.name === selectedCategory
            )?.classifiedBy;

            // If the transaction was classified by LLM, it will be using the full account name.
            if (classificationMethod === 'LLM') {
              // Find the acount related to that categorization.
              const account = accounts.find(
                (account: Account) =>
                  account.name === newDatabaseTransaction.category
              );
              // If the related account exists, update the category name to use the account sub-type instead.
              // Prevents possibility of saving user inputted account names to the database.
              if (account) {
                newDatabaseTransaction.category = account.account_sub_type;
              }
            }

            // Push the new transaction with savable info to array of transactions to be saved to the database.
            newTransactions.push(newDatabaseTransaction);

            // Pass the raw transaction and account ID to add the users "for review" transaction with the updated classification.
            // Passes the raw transaction object as it is needed for update object creation.
            // *** NOTE: need to add tax code integration in the future. ***
            await addForReview(rawTransaction, accountID, 'taxCode');
          }
        }
      });
      // Add all the newly created savable transactions to the database and set no error message to appear.
      await addTransactions(newTransactions);
      setErrorMsg(null);
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
        Classification Results -{' '}
        <span className="text-blue-900">{company_info.name}</span>
      </h1>
      {/* Populate the review table with the categorized transactions. */}
      <ReviewTable
        categorizedTransactions={categorizedTransactions}
        selectedCategories={selectedCategories}
        account_names={accounts}
        handleCategoryChange={handleCategoryChange}
        handleSave={handleSave}
        isSaving={isSaving}
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

          <div id="ReturnButtonContainer" className="flex justify-center">
            <Button
              id="ReturnButton"
              className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
              onClick={() => {
                const url = window.location.origin + window.location.pathname;
                window.location.href = url;
              }}>
              Return to Transactions
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
