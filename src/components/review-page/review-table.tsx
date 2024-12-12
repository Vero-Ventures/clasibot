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
  RawForReviewTransaction,
  ClassifiedForReviewTransaction,
} from '@/types/index';

/**
 * Takes (Variables):
 * Boolean value to indicate when loading and saving,
 * A list of Classified 'For Review' transactions and their Account names,
 * A list of Account names, A list of Classified 'For Review' transactions,
 * And a record of the selected Classifications (Category and Tax Code).
 *
 * Takes (Callbacks):
 * Handlers for updating the selected Classification for a row,
 * Helper method for the processes of saving the selected rows.
 */
export function ReviewTable({
  loadingTransactions,
  isSaving,
  accountNames,
  classifiedTransactions,
  selectedCategories,
  selectedTaxCodes,
  handleCategoryChange,
  handleTaxCodeChange,
  handleSave,
}: Readonly<{
  loadingTransactions: boolean;
  isSaving: boolean;
  accountNames: string[];
  classifiedTransactions: (
    | RawForReviewTransaction
    | ClassifiedForReviewTransaction
  )[][];
  selectedCategories: Record<string, string>;
  selectedTaxCodes: Record<string, string>;
  handleCategoryChange: (transaction_Id: string, category: string) => void;
  handleTaxCodeChange: (transaction_Id: string, taxCode: string) => void;
  handleSave: (
    selectedRows: Record<number, boolean>,
    transactions: (ClassifiedForReviewTransaction | RawForReviewTransaction)[][]
  ) => void;
}>) {
  // Define states for the start and end values of date range filtering.
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Set the default start date and end date on load.
  useEffect(() => {
    // Define the default start and end date (two years ago & current date).
    const startDateTwoYearsPast = new Date();
    const endDatePresent = new Date();
    startDateTwoYearsPast.setFullYear(endDatePresent.getFullYear() - 2);

    // Set the start and end date states with the calculated default values.
    setStartDate(startDateTwoYearsPast);
    setEndDate(endDatePresent);
  }, []);

  // Define helper functions to handle change to date selection and update the Table.
  function changeStartDate(date: Date | null) {
    table.getColumn('date')?.setFilterValue(`${date} to ${endDate}`);
    setStartDate(date);
  }
  function changeEndDate(date: Date | null) {
    table.getColumn('date')?.setFilterValue(`${startDate} to ${date}`);
    setEndDate(date);
  }

  // Define the Classified Transactions array.
  const [formattedTransactions, setFormattedTransactions] = useState<
    ClassifiedForReviewTransaction[]
  >([]);

  // Extract the Classified Transactions and update state on change to Classified Transactions value.
  useEffect(() => {
    // Extract the formatted Transactions from the [Classified, Raw] formatted array.
    const extractedTransactions = [];
    for (const transaction of classifiedTransactions) {
      // Assert the type as it is being added to the array.
      extractedTransactions.push(
        transaction[0] as ClassifiedForReviewTransaction
      );
    }
    // Set the formatted Transactions array to be equal to the extracted values.
    setFormattedTransactions(extractedTransactions);
  }, [classifiedTransactions]);

  // Create states to track and set key Table values.
  // Column to sort by, Column filtering rules, and selected Rows.
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});

  // Creates the React Table using the passed data, helper functions, and states.
  const table = useReactTable({
    // Pass the formatted Transactions as data, a list of Columns, and the Classification update handlers.
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

  // Define Account selection tracker.
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  // Define a callback function to update the Account selection state for Account based filtering.
  function updateAccountSelection(account: string) {
    // Check if the Account is being added or removed from the filter array.
    if (selectedAccounts.includes(account)) {
      // If removing, filter out the Account from the list of Accounts to display.
      setSelectedAccounts(
        selectedAccounts.filter((arrayAccount) => arrayAccount !== account)
      );
    } else {
      // Otherwise, add the Account to the list of Accounts to display.
      setSelectedAccounts([...selectedAccounts, account]);
    }
  }

  // Whenever there is a change to the list of Account names, sets all Accounts as selected.
  useEffect(() => {
    setSelectedAccounts(accountNames);
  }, [accountNames]);

  // Whenever the selected Accounts or Table changes, updates the Account based filtering.
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

      <ReviewTableDisplay
        table={table}
        loadingTransactions={loadingTransactions}
      />

      <TablePaginationAndSave
        table={table}
        rowSelection={rowSelection}
        classifiedTransactions={classifiedTransactions}
        isSaving={isSaving}
        handleSave={handleSave}
      />
    </div>
  );
}
