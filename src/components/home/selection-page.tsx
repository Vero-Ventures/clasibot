/**
 * Defines the content displayed on the selection page and the functionality needed to implement the selection process.
 */
'use client';
import { useEffect, useState } from 'react';
import { getTransactions } from '@/actions/quickbooks';
import { SelectionTable } from '@/components/data-table/selection-table';
import type { Transaction } from '@/types/Transaction';
import { filterToUncategorized } from '@/utils/filter-transactions';

// Selection page takes a function to handle classification, a boolean to check if classifying, and the company name.
export default function SelectionPage({
  handleClassify,
  isClassifying,
  company_name,
}: Readonly<{
  handleClassify: (selectedRows: Transaction[]) => void;
  isClassifying: boolean;
  company_name: string;
}>) {
  // Create a state to track and update the list of transactions.
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Create a state to track and update the list of account names.
  const [accounts, setAccounts] = useState<string[]>([]);

  // Use effect to fetch transactions from the server that runs once.
  useEffect(() => {
    // Function to fetch transactions from the server.
    const fetchTransactions = async () => {
      try {
        // Call the get transactions function.
        const response = await getTransactions();

        // Parse the response as JSON.
        const result = JSON.parse(response);

        // If the success indicator element of the result is 'Success':.
        if (result[0].result === 'Success') {
          // Update the transactions state with the result excluding the success indicator element.
          setTransactions(result.slice(1));
        }

        // Create a set to track account names without duplicates.
        const accountNames = new Set<string>();

        // Loop through each categorized transaction and add the account name to the set.
        for (const transaction of result.slice(1)) {
          accountNames.add(transaction.account);
        }

        // Convert the set to an array and update the accounts state with a list of unique account names.
        setAccounts(Array.from(accountNames));
      } catch (error) {
        // Log an error if fetching transactions fails.
        console.error('Error fetching purchases:', error);
      }
    };

    // Call the fetch transactions function.
    fetchTransactions();
  }, []);

  return (
    <>
      <h1
        id="PageAndCompanyName"
        className="m-auto mb-4 text-center text-3xl font-bold">
        My Transactions - <span className="text-blue-900">{company_name}</span>
      </h1>
      {/* Display the selection table with the fetched transactions. */}
      <SelectionTable
        transactions={filterToUncategorized(transactions)}
        account_names={accounts}
        isClassifying={isClassifying}
        handleClassify={handleClassify}
      />
    </>
  );
}
