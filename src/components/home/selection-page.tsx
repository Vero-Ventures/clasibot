'use client';
import { useEffect, useState } from 'react';
import { getTransactions } from '@/actions/quickbooks/get-transactions';
import { SelectionTable } from '@/components/data-table/selection-table';
import type { Transaction } from '@/types/Transaction';

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
  // Create states to track and set the important values.
  // Transactions and account names.
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<string[]>([]);

  // Use the useEffect hook to fetch transactions on page load.
  useEffect(() => {
    // Create a function to fetch transactions from the server.
    const fetchTransactions = async () => {
      try {
        // Call the get transactions function.
        const response = await getTransactions();
        const result = JSON.parse(response);

        if (result[0].result === 'Success') {
          // Update the transactions state with the result excluding the success indicator element.
          setTransactions(result.slice(1));
        }

        // Create a set to track account names without duplicates and add all the account names to the set.
        const accountNames = new Set<string>();
        for (const transaction of result.slice(1)) {
          accountNames.add(transaction.account);
        }
        // Update the accounts state with a list of unique account names.
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
      <SelectionTable
        transactions={transactions}
        account_names={accounts}
        isClassifying={isClassifying}
        handleClassify={handleClassify}
      />
    </>
  );
}
