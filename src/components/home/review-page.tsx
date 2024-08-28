'use client';
import { useEffect, useState } from 'react';
import { findPurchase, updatePurchase } from '@/actions/quickbooks/purchases';
import type { Account } from '@/types/Account';
import type { ClassifiedCategory } from '@/types/Category';
import type { Transaction, CategorizedTransaction } from '@/types/Transaction';
import { Button } from '@/components/ui/button';
import { ReviewTable } from '@/components/data-table/review-table';
import { addTransactions } from '@/actions/transaction-database';
import { getAccounts } from '@/actions/quickbooks/get-accounts';

// Takes a list of categorized transactions, a record with the categorization results, and the company name.
export default function ReviewPage({
  categorizedTransactions,
  categorizationResults,
  company_name,
}: Readonly<{
  categorizedTransactions: CategorizedTransaction[];
  categorizationResults: Record<string, ClassifiedCategory[]>;
  company_name: string;
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
        // Look for the first category in the categorization results.
        const firstCategory =
          categorizationResults[transaction.transaction_ID]?.[0]?.name;
        // If a category is found, add it to the initial categories record.
        if (firstCategory) {
          initialCategories[transaction.transaction_ID] = firstCategory;
        }
      });
      // Update the selected categories state with the initial categories.
      setSelectedCategories(initialCategories);
    };

    // Create a set to track account names without duplicates, then add all account names to the set.
    const accountNames = new Set<string>();
    for (const transaction of categorizedTransactions) {
      accountNames.add(transaction.account);
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
  async function handleSave(selectedRows: CategorizedTransaction[]) {
    // Set the saving status to true.
    setIsSaving(true);
    try {
      // Create an array to store the new transactions.
      const newTransactions: Transaction[] = [];
      // Update each selected row with the selected category.
      await Promise.all(
        selectedRows.map(async (transaction) => {
          const transactionID = transaction.transaction_ID;
          // Find the matching the purchase object from QuickBooks.
          const purchaseObj = await findPurchase(transactionID);
          // Get the id of the selected category.
          const categoryName = selectedCategories[transactionID];

          // Find the transaction category with the matching name and get its ID.
          const accountID = transaction.categories.find(
            (category) => category.name === categoryName
          )?.id;

          if (!accountID || !purchaseObj) {
            throw new Error('Error saving purchase');
          } else {
            // Iterate through line data of raw purchase object.
            for (const line of purchaseObj.Line) {
              // The location of the account reference is in the AccountBasedExpenseLineDetail field.
              if (line.DetailType === 'AccountBasedExpenseLineDetail') {
                // If it is present, update the account ID value to connect it to the related account.
                line.AccountBasedExpenseLineDetail.AccountRef.value = accountID;
                line.AccountBasedExpenseLineDetail.AccountRef.name =
                  categoryName;
                // Once the account ID is updated, break the loop.
                break;
              }
            }
            // Create regular transaction using the transaction and the name of the selected category.
            const newTransaction: Transaction = {
              name: transaction.name,
              category: categoryName,
              amount: transaction.amount,
              date: transaction.date,
              account: transaction.account,
              transaction_type: transaction.transaction_type,
              transaction_ID: transactionID,
            };

            // Get accounts to check against if the category is classified by LLM.
            const accounts = JSON.parse(await getAccounts());

            // Find the classification method of the selected category.
            for (const category of transaction.categories) {
              if (category.name === categoryName) {
                // Before storing LLM classified categories, switch from the account name to account_sub_type.
                if (category.classifiedBy === 'LLM') {
                  // Find the account with the matching name.
                  const account = accounts.find(
                    (account: Account) => account.name === transaction.account
                  );
                  // If the account is found, update the category name to the account_sub_type.
                  if (account) {
                    newTransaction.category = account.account_sub_type;
                  }
                }
              }
            }

            // Push the new transaction to the new transactions array.
            newTransactions.push(newTransaction);

            // Update the purchase in QuickBooks using the updated purchase object.
            const result = await updatePurchase(purchaseObj);
            // If the result of the purchase update is empty, throw an error.
            if (result === '{}') {
              throw new Error('Error saving purchase');
            }
          }
        })
      );
      // Add the new transactions to the database.
      addTransactions(newTransactions);
      // If no errors are thrown, set the error message to null.
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
        <span className="text-blue-900">{company_name}</span>
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