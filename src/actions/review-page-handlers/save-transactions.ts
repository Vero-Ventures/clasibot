'use server';

import { addDatabaseTransactions } from '@/actions/db-transactions';

import { removeSelectedForReviewTransaction } from '@/actions/db-review-transactions/index';

import { addForReview, getAccounts } from '@/actions/quickbooks/index';

import type {
  Account,
  ClassifiedElement,
  RawForReviewTransaction,
  ClassifiedForReviewTransaction,
  Transaction,
} from '@/types/index';

// Preforms the nessasary steps to save selected Classified 'For Review' transactions.
// Determines the Classifications for each 'For Review' transaction based on the selection values from the table,
// Also updates the database for later prediction use, updates QuickBooks with the Classified Transactions, and updates the frontend.
// Takes: The selected rows from the table, the list of 'For Review' transactions from the table,
//        The record of selected Categories and Tax Codes,
//        Also takes state update methods for: Saving, Saving Error Message, and Opening the Save Complete modal.
// Returns: A boolean value indicating save falure used to set the error message on the frontend.
export async function saveSelectedTransactions(
  selectedRows: Record<number, boolean>,
  transactions: (ClassifiedForReviewTransaction | RawForReviewTransaction)[][],
  selectedCategories: Record<string, string>,
  selectedTaxCodes: Record<string, string>
): Promise<boolean> {
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
      throw new Error('Accounts Fetch Failed');
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
        ][1] as RawForReviewTransaction;

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
            throw new Error(addResult.message);
          }

          // Remove the related 'For Review' transaction and its connections from the database.
          const removeResult =
            await removeSelectedForReviewTransaction(rawTransaction);

          // If removing the Transaction resulted in an error, throw the Query Result message as an error.
          if (removeResult.result === 'Error') {
            throw new Error(removeResult.message);
          }
        }
      }
    });

    // Add all the newly created Transactions to the database.
    const addTransactionsResult =
      await addDatabaseTransactions(newTransactions);
    // Check the Query Result if returned by the add Transactions function resulted in an error.
    if (addTransactionsResult.result === 'Error') {
      // If the result was an error, log the message and detail.
      console.error(
        'Error saving existing Classified Transactions:',
        addTransactionsResult.message,
        ', Detail: ',
        addTransactionsResult.detail
      );
      // Return a failure result.
      return false;
    }
    // If no errors occured, return a truth value to set an empty error message.
    return true;
  } catch (error) {
    // Catch any errors and log them (include the error message if it is present).
    if (error instanceof Error) {
      console.error('Error saving existing Classified Transactions:', error);
    } else {
      console.error('Error saving existing Classified Transactions:', error);
    }
    // On error, return a failure result.
    return false;
  }
}
