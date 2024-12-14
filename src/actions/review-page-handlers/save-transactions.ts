'use server';

import { addDatabaseTransactions } from '@/actions/db-transactions';

import { removeSelectedForReviewTransaction } from '@/actions/db-review-transactions/index';

import { getAccounts, addForReview } from '@/actions/quickbooks/index';

import type {
  Account,
  Transaction,
  RawForReviewTransaction,
  ClassifiedForReviewTransaction,
  ClassifiedElement,
  QueryResult,
} from '@/types/index';

// Takes: A record of selected rows, an array of Classified and Raw 'For Review' transactions,
//        And a record of 'For Review' transaction Id to Classification Id for both Classification types.
// Returns: A success boolean
export async function saveSelectedTransactions(
  selectedRows: Record<number, boolean>,
  transactions: (ClassifiedForReviewTransaction | RawForReviewTransaction)[][],
  selectedCategories: Record<string, string>,
  selectedTaxCodes: Record<string, string>
): Promise<boolean> {
  try {
    // Call the list of 'Expense' Accounts to get Account Id's from the recorded Account names.
    const accountResults = await getAccounts('Expense');

    // Initally set Accounts variable to be empty.
    let accounts: Account[] = [];

    // Check if the Accounts fetch resulted in an error.
    if ((accountResults[0] as QueryResult).result === 'Error') {
      // If Accounts fetch failed, log an error message and throw an error to be caught and displayed.
      console.error(
        'Error Fetching Accounts: ' + (accountResults[0] as QueryResult).message
      );
      throw new Error('Accounts Fetch Failed');
    } else {
      // Set the Accounts variable to the Account results with the Query Result in the first index removed.
      accounts = accountResults.slice(1) as Account[];
    }

    // Get the selected Rows in an iterable format [key: selectedRowIndex, value: true]
    // The key is the index of the Row and the value is true for selected Rows.
    const selectedRowIndices = Object.entries(selectedRows);

    // Call handler to iterate through the selected rows.
    // Define the array of objects to be batch added to QuickBooks and to be saved for reference.
    const [batchAddTransactions, newDatabaseTransactions, transactionAccounts] =
      parseSelectedRows(
        selectedRowIndices,
        transactions,
        selectedCategories,
        selectedTaxCodes,
        accounts
      );

    // Call backend method to add the Classified 'For Review' Transactions to QuickBooks.
    const addResult = await addForReview(
      batchAddTransactions,
      transactionAccounts
    );

    // If adding the new Transactions resulted in an error, throw the Query Result message as an error.
    if (addResult.result === 'Error') {
      throw new Error(addResult.message);
    }

    // Remove the added 'For Review' transactions and their connections.
    const removeResult =
      await removeSelectedForReviewTransaction(batchAddTransactions);

    // If removing the Transaction resulted in an error, throw the Query Result message as an error.
    if (removeResult.result === 'Error') {
      throw new Error(removeResult.message);
    }

    // Add all the newly created Transactions.
    const addTransactionsResult = await addDatabaseTransactions(
      newDatabaseTransactions
    );

    // Check the Query Result if returned by the add Transactions function resulted in an error.
    if (addTransactionsResult.result === 'Error') {
      // If the result was an error, log the message and detail.
      console.error(
        'Error Saving Existing Classified Transactions:',
        addTransactionsResult.message,
        ', Detail: ',
        addTransactionsResult.detail
      );
      // Return a failure result.
      return false;
    }

    // If no errors occured, return a success result.
    return true;
  } catch (error) {
    // Catch any errors and log them (include the error message if it is present).
    if (error instanceof Error) {
      console.error('Error Saving Existing Classified Transactions:', error);
    } else {
      console.error('Error Saving Existing Classified Transactions:', error);
    }
    // On error, return an error / failure result.
    return false;
  }
}

// Takes: The indices of the selected rows, the related Classified and Raw 'For Review' transactions,
//        A record of Classification Id to Transaction Id for both Classification, and an array of 'Expense' accounts.
// Returns: An array of 'For Review' transaction values used for batch addition to QuickBooks,
//          An array of Classified Transaction to save to the database,
//          And a list of Accounts the 'For Review' transactions belong to.
function parseSelectedRows(
  selectedRowIndices: [string, boolean][],
  transactions: (ClassifiedForReviewTransaction | RawForReviewTransaction)[][],
  selectedCategories: Record<string, string>,
  selectedTaxCodes: Record<string, string>,
  accounts: Account[]
): [
  {
    forReviewTransaction: RawForReviewTransaction;
    categoryId: string;
    taxCodeId: string;
  }[],
  Transaction[],
  string[],
] {
  try {
    // Define arrays for the different types of parsed Transactions.
    // ('For Review' for QuickBooks and QBO API for database).
    const newDatabaseTransactions: Transaction[] = [];
    const batchAddTransactions: {
      forReviewTransaction: RawForReviewTransaction;
      categoryId: string;
      taxCodeId: string;
    }[] = [];

    // Define an array to list the different Accounts that the 'For Review' transactions belong to.
    const transactionAccounts: string[] = [];

    // Iterate through the selected Rows, using only values where selected = true.
    selectedRowIndices.forEach(async ([index, selected]) => {
      if (selected) {
        // Get the Row index as a number and use it to define the Classified and Raw 'For Review' transactions.
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

        // Define inital null values for the Classifications.
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

        if (category && taxCode) {
          // Create a new Transaction to be saved using the Classified Transaction and its Classifications.
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

            // If the related Account exists, use the sub-type of the Account instead.
            if (account) {
              // Prevents possibility of saving user created Account names to the database.
              newDatabaseTransaction.category = account.account_sub_type;
            } else {
              // If no match is found, throw an error.
              throw new Error('Error Saving Purchase');
            }
          }

          // Push the Raw 'For Review' transaction and its Classification Id's to the array for batch adding to QuickBooks.
          batchAddTransactions.push({
            forReviewTransaction: rawTransaction,
            categoryId: category.id,
            taxCodeId: taxCode.id,
          });

          // Push the new Transaction to the array of Classified Transactions to be saved.
          newDatabaseTransactions.push(newDatabaseTransaction);

          // Check if the 'For Review' transaction Account is already in the list of related Accounts.
          if (!transactionAccounts.includes(rawTransaction.qboAccountId)) {
            // Add the Account Id to the list of Accounts.
            transactionAccounts.push(rawTransaction.qboAccountId);
          }
        } else {
          // Throw an error if the Id for the current Transaction cannot be found.
          // Occurs if the selected Classification is not present in Classified 'For Review' transaction's Classifications.
          throw new Error('Error Saving Purchase');
        }
      }
    });

    // Return the 'For Review' transactions to be batch added and the Classified Transactions to be saved.
    // Also returns the array of Account Id's for the 'For Review' transactions.
    return [batchAddTransactions, newDatabaseTransactions, transactionAccounts];
  } catch (error) {
    // Catch any errors and log them with the error message if it is present.
    if (error instanceof Error) {
      console.error('Error Saving Classified Transactions: ', error.message);
    } else {
      console.error('Unexpected Error Saving Classified Transactions.');
    }
    // On error, return empty arrays for the Transactions to be saved (and Account names).
    return [[], [], []];
  }
}
