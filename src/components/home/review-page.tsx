/**
 * Defines the content displayed on the review page and the functionality needed to implement the review process.
 */
'use client';
import { useEffect, useState } from 'react';
import { findPurchases, updatePurchase } from '@/actions/quickbooks';
import type { ClassifiedCategory } from '@/types/Category';
import type { CategorizedTransaction } from '@/types/Transaction';
import { Button } from '@/components/ui/button';
import { ReviewTable } from '@/components/data-table/review-table';

// Review page takes a list of categorized transactions, a record with the categorization results, and the company name.
export default function ReviewPage({
  categorizedTransactions,
  categorizationResults,
  company_name,
}: Readonly<{
  categorizedTransactions: CategorizedTransaction[];
  categorizationResults: Record<string, ClassifiedCategory[]>;
  company_name: string;
}>) {
  // Create a state to track and update the selected categories.
  const [selectedCategories, setSelectedCategories] = useState<
    Record<string, string>
  >({});
  // Create a state to track and update the saving status.
  const [isSaving, setIsSaving] = useState(false);

  // Create a state to track and update the modal status.
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Create a state to track and update an error message.
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create a state to track and update the account names.
  const [accounts, setAccounts] = useState<string[]>([]);

  // Use effect to update the categorizations for each transaction.
  // Runs when categorized transactions or categorization results change.
  useEffect(() => {
    // Initialize the selected categories for each transaction.
    const initializeCategories = async () => {
      // Create a record to store the categories.
      const initialCategories: Record<string, string> = {};
      // Loop through each transaction.
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

    // Create a set to track account names without duplicates.
    const accountNames = new Set<string>();

    // Loop through each categorized transaction and add the account name to the set.
    for (const transaction of categorizedTransactions) {
      accountNames.add(transaction.account);
    }

    // Convert the set to an array and update the accounts state with a list of unique account names.
    setAccounts(Array.from(accountNames));

    // Call the initialize categories function.
    initializeCategories();
  }, [categorizedTransactions, categorizationResults]);

  // Function to handle category changes using the transaction ID and category.
  function handleCategoryChange(transactionID: string, category: string) {
    // Update the selected categories state with the transaction and category pair at the end.
    setSelectedCategories({
      ...selectedCategories,
      [transactionID]: category,
    });
  }

  // Function to handle saving the selected categories using the selected rows.
  async function handleSave(selectedRows: CategorizedTransaction[]) {
    // Set the saving status to true.
    setIsSaving(true);
    try {
      // Update each selected row with the selected category.
      await Promise.all(
        selectedRows.map(async (transaction) => {
          // Get the transaction ID of the current transactions.
          const transactionID = transaction.transaction_ID;

          // Find the matching the purchase object from QuickBooks.
          // Returned value is set to be unformatted.
          const purchaseObj = await findPurchases(transactionID, false);

          // Convert the purchase object to JSON.
          const purchaseObjJson = JSON.parse(purchaseObj);

          // Get the id of the selected category.
          const categoryName = selectedCategories[transactionID];

          // Using the transaction categories and, find the category with the matching name.
          // Get the account ID from the selected category.
          const accountID = transaction.categories.find(
            (category) => category.name === categoryName
          )?.id;

          // Check that the account ID and purchase object are present.
          if (!accountID || !purchaseObjJson) {
            throw new Error('Error saving purchase');
          } else {
            // If an account ID and purchase object are found, update the purchase object with the selected category
            // Iterate through line data of raw purchase object.
            for (const line of purchaseObjJson.Line) {
              // The location of the account reference is in the AccountBasedExpenseLineDetail field.
              if (line.DetailType === 'AccountBasedExpenseLineDetail') {
                // If it is present, update the account ID value to connect it to the related account.
                line.AccountBasedExpenseLineDetail.AccountRef.value = accountID;
                line.AccountBasedExpenseLineDetail.AccountRef.name =
                  categoryName;
                break;
              }
            }

            // Update the purchase object with the account ID.
            // Because the purchase object is in original format, it can be easily updated with the new account ID..
            const result = await updatePurchase(purchaseObjJson);

            // If the result is empty, throw an error.
            if (result === '{}') {
              throw new Error('Error saving purchase');
            }
          }
        })
      );
      // If no errors are thrown, set the error to null.
      setErrorMsg(null);
    } catch (error) {
      // Catch any errors, log them, and set the error message.
      console.error('Error saving categories:', error);
      setErrorMsg('An error occurred while saving. Please try again.');
    } finally {
      // Once the saving process is complete, set the saving status to false and open the modal.
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
      {/* Only display modal after attempt to save sets modal open to true */}
      <div
        className={`fixed left-0 top-0 flex h-full w-full items-center justify-center bg-gray-900 bg-opacity-50 ${isModalOpen ? '' : 'hidden'}`}>
        <div className="mx-4 w-96 rounded-lg bg-white p-6">
          {/* If an error is present, display an error message */}
          {errorMsg ? (
            <>
              <h2 className="mb-4 text-center text-2xl font-bold text-red-500">
                Error
              </h2>
              <p className="mb-6 text-center font-medium text-gray-800">
                {errorMsg}
              </p>
            </>
          ) : (
            // If no error is present, display a success message
            <>
              <h2 className="mb-4 text-center text-2xl font-bold text-green-500">
                Success
              </h2>
              <p className="mb-6 text-center font-medium text-gray-800">
                Transactions have been saved.
              </p>
            </>
          )}

          <div id="ReturnButtonContainer" className="flex justify-center">
            <Button
              id="ReturnButton"
              className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
              onClick={() => window.location.reload()}>
              Return to Transactions
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
