'use client';
import { useEffect, useState } from 'react';
import { getForReview } from '@/actions/quickbooks/get-for-review';
import { SelectionTable } from '@/components/data-table/selection-table';
// import type { Account } from '@/types/Account';
import type { CompanyInfo } from '@/types/CompanyInfo';
import type {
  ForReviewTransaction,
  FormattedForReviewTransaction,
} from '@/types/ForReviewTransaction';
// import { getAccounts } from '@/actions/quickbooks/get-accounts';

// Selection page takes a function to handle classification, a boolean to check if classifying, and the company name.
export default function SelectionPage({
  handleClassify,
  isClassifying,
  company_info,
  finished_loading,
}: Readonly<{
  handleClassify: (
    selectedRows: Record<number, boolean>,
    transactions: (FormattedForReviewTransaction | ForReviewTransaction)[][]
  ) => void;
  isClassifying: boolean;
  company_info: CompanyInfo;
  finished_loading: boolean;
}>) {
  // Create states to track and set the key values.
  // Returned "For Review" transactions is an array of arrays with a sub array for each transaction.
  // Array is formatted [formmated transation, unformatted transation].
  const [forReviewTransactions, setForReviewTransactions] = useState<
    (FormattedForReviewTransaction | ForReviewTransaction)[][]
  >([]);
  const [foundForReviewTransactions, setForReviewFoundTransactions] =
    useState<boolean>(false);
  const [accounts, setAccounts] = useState<string[]>([]);

  // Use the useEffect hook to fetch transactions on page load.
  useEffect(() => {
    // Create a function to fetch transactions from the server.
    const fetchTransactions = async () => {
      try {
        // Get all the accounts assosiated with transactions.
        // const transactionAccounts: Account[] = JSON.parse(
        //   await getAccounts('Transaction')
        // );

        const testTransactionAccounts = [{ id: '144', name: 'BMO Chq - 4940' }];

        //

        // Iterate through the account ID's to fetch all their assosiated "For Review" transactions.
        const forReviewTransactions: (
          | FormattedForReviewTransaction
          | ForReviewTransaction
        )[][] = [];
        for (const transactionAccount of testTransactionAccounts) {
          const newForReviewTransactions = await getForReview(
            transactionAccount.id
          );
          if (newForReviewTransactions.result === 'Success') {
            forReviewTransactions.push(
              ...JSON.parse(newForReviewTransactions.detail)
            );
          }
        }

        // Create a set to track account names without duplicates and add all the account names to the set.
        const accountNames = new Set<string>();

        // Iterate through the transactions to get, updated, and record the name of the account for the for review transactions.
        for (let index = 0; index < forReviewTransactions.length; index++) {
          // Define the typing of the transaction at the current index
          const currentTransaction = forReviewTransactions[
            index
          ][0] as FormattedForReviewTransaction;
          // Find the account assosiated with the ID defined in the transaction
          const accountName = testTransactionAccounts.find(
            (account) => account.id === currentTransaction.account
          )?.name;
          if (accountName) {
            // Update the account name of the current transaction and write it back to the for review transactions array.
            currentTransaction.accountName = accountName;
            forReviewTransactions[index][0] = currentTransaction;
            // If an account name was found, add it to the account names array.
            accountNames.add(accountName);
          }
        }

        // Set the found transactions to the resulting array of "For Review" transactions and set the transactions to found.
        setForReviewTransactions(forReviewTransactions);
        setForReviewFoundTransactions(true);
        // Update the accounts state with a list of unique account names.
        setAccounts(Array.from(accountNames));
      } catch (error) {
        // Log an error if fetching transactions fails.
        console.error('Error fetching "For Review" transactions:', error);
      }
    };
    // Call the fetch "For Review" transactions function.
    fetchTransactions();
  }, []);

  return (
    <>
      <h1
        id="PageAndCompanyName"
        className="m-auto mb-4 text-center text-3xl font-bold">
        My Transactions -{' '}
        <span className="text-blue-900">{company_info.name}</span>
      </h1>
      <SelectionTable
        transactions={forReviewTransactions}
        account_names={accounts}
        found_transactions={foundForReviewTransactions}
        company_info={company_info}
        finished_loading={finished_loading}
        isClassifying={isClassifying}
        handleClassify={handleClassify}
      />
    </>
  );
}
