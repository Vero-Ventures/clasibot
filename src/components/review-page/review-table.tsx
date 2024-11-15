'use client';

import { useState, useEffect } from 'react';

import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { ColumnFiltersState, SortingState } from '@tanstack/react-table';

import {
  ReviewColumns,
  ReviewTableFilters,
  TablePaginationAndSave,
  ReviewTableDisplay,
} from '@/components/review-page-components/index';

import type {
  ForReviewTransaction,
  ClassifiedForReviewTransaction,
} from '@/types/index';

/**
 * Takes (Variables):
 * A list of Account names, A list of Classified 'For Review' transactions,
 * A record of the selected Classifications, and a bolean value to indicate when saving.
 *
 * Takes (Callbacks): Handlers for the Classification and saving processes.
 */
export function ReviewTable({
  accountNames,
  categorizedTransactions,
  selectedCategories,
  selectedTaxCodes,
  handleCategoryChange,
  handleTaxCodeChange,
  isSaving,
  handleSave,
}: Readonly<{
  accountNames: string[];
  categorizedTransactions: (
    | ForReviewTransaction
    | ClassifiedForReviewTransaction
  )[][];
  selectedCategories: Record<string, string>;
  selectedTaxCodes: Record<string, string>;
  handleCategoryChange: (transaction_Id: string, category: string) => void;
  handleTaxCodeChange: (transaction_Id: string, taxCode: string) => void;
  isSaving: boolean;
  handleSave: (
    selectedRows: Record<number, boolean>,
    transactions: (ClassifiedForReviewTransaction | ForReviewTransaction)[][]
  ) => void;
}>) {
  // Define the default start and end date (two years ago & current date).
  const currentDate = new Date();
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(currentDate.getFullYear() - 2);

  // Create states to track and set the start and end values for the date filter.
  const [startDate, setStartDate] = useState<Date | null>(twoYearsAgo);
  const [endDate, setEndDate] = useState<Date | null>(currentDate);

  // Define functions to handle change to the date selection and update the Table filtering.
  function changeStartDate(date: Date | null) {
    table.getColumn('date')?.setFilterValue(`${date} to ${endDate}`);
    setStartDate(date);
  }
  function changeEndDate(date: Date | null) {
    table.getColumn('date')?.setFilterValue(`${startDate} to ${date}`);
    setEndDate(date);
  }

  // Extract the formatted Transactions from the [Classified, Raw] formatted array.
  const formattedTransactions: ClassifiedForReviewTransaction[] = [];
  for (const transaction of categorizedTransactions) {
    // Assert the object type as it is being added to the array.
    formattedTransactions.push(
      transaction[0] as ClassifiedForReviewTransaction
    );
  }

  // Create states to track and set key Table values.
  // Column to sort by, Column filtering rules, and selected Rows.
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});

  // Creates the React Table using the passed data, helper functions, and states.
  const table = useReactTable({
    // Pass the Transactions as data, a list of Columns, and the Classification update handlers.
    data: formattedTransactions,
    columns: ReviewColumns(
      selectedCategories,
      selectedTaxCodes,
      handleCategoryChange,
      handleTaxCodeChange
    ),
    // Pass the state setters to the Table.
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    // Define parameters for the Table.
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // Pass the relevant states to the Table.
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  // Define account selection tracking state.
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  // Update the Account selection state for Account based filtering.
  function updateAccountSelection(account: string) {
    // Check if the Account is being added or removed from the filter.
    if (selectedAccounts.includes(account)) {
      // Remove the Account from the list of Accounts to display.
      setSelectedAccounts(
        selectedAccounts.filter((arrayAccount) => arrayAccount !== account)
      );
    } else {
      // Add the Account to the list of Accounts to display.
      setSelectedAccounts([...selectedAccounts, account]);
    }
  }

  // Update the selected Accounts list whenever there is a change to the list of Account names.
  useEffect(() => {
    setSelectedAccounts(accountNames);
  }, [accountNames]);

  // Update the Account filter in the table when the selected Accounts change.
  useEffect(() => {
    // If no Accounts are selected, set the Account filter false which shows all results.
    if (selectedAccounts.length === 0) {
      table.getColumn('account')?.setFilterValue(() => false);
    }
    // Otherwise, update the filter function with the new array of Accounts.
    table.getColumn('account')?.setFilterValue(selectedAccounts);
  }, [selectedAccounts, table]);

  return (
    <div className="w-full">
      <ReviewTableFilters
        startDate={startDate}
        endDate={endDate}
        accountNames={accountNames}
        selectedAccounts={selectedAccounts}
        table={table}
        changeStartDate={changeStartDate}
        changeEndDate={changeEndDate}
        updateAccountSelection={updateAccountSelection}
      />

      <ReviewTableDisplay table={table} />

      <TablePaginationAndSave
        table={table}
        rowSelection={rowSelection}
        categorizedTransactions={categorizedTransactions}
        isSaving={isSaving}
        handleSave={handleSave}
      />
    </div>
  );
}
