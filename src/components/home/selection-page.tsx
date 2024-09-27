'use client';
import { useEffect, useState } from 'react';
import { getForReview } from '@/actions/quickbooks/get-for-review';
import { SelectionTable } from '@/components/data-table/selection-table';
import type { Account } from '@/types/Account';
import type { CompanyInfo } from '@/types/CompanyInfo';
import type {
  ForReviewTransaction,
  FormattedForReviewTransaction,
} from '@/types/ForReviewTransaction';
import { getAccounts } from '@/actions/quickbooks/get-accounts';

// Selection page takes a function to handle classification, a boolean to check if classifying, and the company name.
export default function SelectionPage({
  handleClassify,
  isClassifying,
  company_info,
  finished_loading,
}: Readonly<{
  handleClassify: (selectedRows: FormattedForReviewTransaction[]) => void;
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
        const transactionAccounts: Account[] = JSON.parse(
          await getAccounts('Transaction')
        );
        // Iterate through the account ID's to fetch all their assosiated "For Review" transactions.
        const forReviewTransactions = [];
        for (const transactionAccount of transactionAccounts) {
          const newForReviewTransactions = await getForReview(
            transactionAccount.id
          );
          if (newForReviewTransactions.result === 'Success') {
            forReviewTransactions.push(
              ...JSON.parse(newForReviewTransactions.detail)
            );
          }
        }
        // Set the found transactions to the resulting array of "For Review" transactions and set the transactions to found.
        setForReviewTransactions(forReviewTransactions);
        setForReviewFoundTransactions(true);

        // Create a set to track account names without duplicates and add all the account names to the set.
        const accountNames = new Set<string>();
        for (const transaction of forReviewTransactions) {
          // Look in the first index of the sub array to get account from formatted version.
          accountNames.add(transaction[0].account);
        }
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
        finished_loading={finished_loading}
        isClassifying={isClassifying}
        handleClassify={handleClassify}
      />
    </>
  );
}
