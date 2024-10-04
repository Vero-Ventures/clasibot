/**
 * Defines how the table for the review page is populated, functions, and displays.
 */
'use client';
import { useState, useEffect } from 'react';
import type { ColumnFiltersState, SortingState } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { reviewColumns } from './columns';
import type {
  ForReviewTransaction,
  CategorizedForReviewTransaction,
} from '@/types/ForReviewTransaction';

/**
 * Function Values:
 * a list of categorized transactions, a record of the selected categories,
 * a list of account names, and a value to indicate saving is in progress.
 */
// Function Callbacks: a function to handle category changes, and a function to handle saving.
export function ReviewTable({
  categorizedTransactions,
  selectedCategories,
  account_names,
  handleCategoryChange,
  handleTaxCodeChange,
  handleSave,
  isSaving,
}: Readonly<{
  categorizedTransactions: (
    | ForReviewTransaction
    | CategorizedForReviewTransaction
  )[][];
  selectedCategories: Record<string, string>;
  account_names: string[];
  handleCategoryChange: (transaction_ID: string, category: string) => void;
  handleTaxCodeChange: (transaction_ID: string, taxCode: string) => void;
  handleSave: (
    selectedRows: Record<number, boolean>,
    transactions: (CategorizedForReviewTransaction | ForReviewTransaction)[][]
  ) => void;
  isSaving: boolean;
}>) {
  // Create states to track and set the important values.
  // Column to sort by, Column filtering rules, selected Rows, and accounts to display Rows from.
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  // Function to update the account selection state.
  const updateAccountSelection = (account: string) => {
    if (selectedAccounts.includes(account)) {
      // Filter out the account from the selected accounts and update the state.
      setSelectedAccounts(
        selectedAccounts.filter((arrayAccount) => arrayAccount !== account)
      );
    } else {
      // Add the account to the selected accounts and update the state.
      setSelectedAccounts([...selectedAccounts, account]);
    }
  };

  // Updates the 'selected accounts' state when the 'account names' value changes.
  useEffect(() => {
    setSelectedAccounts(account_names);
  }, [account_names]);

  // Extract the formatted transactions from the combined arrays.
  const formattedTransactions = [];
  for (const transaction of categorizedTransactions) {
    // Asser that the transaction type is formmated. Needed due to data coming from multi-typed array.
    formattedTransactions.push(
      transaction[0] as CategorizedForReviewTransaction
    );
  }

  // Creates the react table using passed data, helper functions, and state elements.
  const table = useReactTable({
    // Pass the transactions as data, as well as a list of columns and the category change function.
    data: formattedTransactions,
    columns: reviewColumns(selectedCategories, handleCategoryChange, handleTaxCodeChange),
    // Pass the set state functions to table actions.
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    // Define parameters for the table.
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // Pass the relevant states to the table.
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  // Update the account filter in the table when the selected accounts change.
  useEffect(() => {
    // If no accounts are selected, set the account filter value to false to show all results.
    if (selectedAccounts.length === 0) {
      table.getColumn('account')?.setFilterValue(() => false);
    }
    // Otherwise update the filter function with the new array of account names.
    table.getColumn('account')?.setFilterValue(selectedAccounts);
  }, [selectedAccounts, table]);

  return (
    <div className="w-full">
      {/* Container for the table filtering options. */}
      <div id="FiltersContainer" className="md:align-start md:w-3/4 lg:w-5/6">
        <div className="flex justify-center px-2 py-4 mb:px-4 popout:px-6 md:justify-start lg:px-10">
          {/* Create an input to take text and filter to transactions with matching names. */}
          <Input
            id="NameFilterInput"
            placeholder="Filter by name..."
            // Set the input value to the name filter from the table (or an empty string)..
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            // When the input value changes, update the name filter value with the new value.
            onChange={(event) =>
              table.getColumn('name')?.setFilterValue(event.target.value)
            }
            className="mr-2 w-2/3 max-w-xs popout:mr-4 popout:w-1/2 md:mr-6 md:w-2/3"
          />
          {/* Create a dropdown menu to select accounts to filter by. */}
          <div
            id="AccountFilter"
            className="ml-2 max-w-48 popout:ml-4 popout:w-1/4 md:ml-6 md:w-1/3">
            <DropdownMenu>
              {/* Define a button to trigger the dropdown menu. */}
              <DropdownMenuTrigger asChild>
                <Button
                  id="AccountsDropdownButton"
                  variant="outline"
                  className="w-full bg-blue-500 text-white hover:bg-blue-800 hover:text-white">
                  {/* Chevron down acts a down arrow icon */}
                  Accounts <ChevronDown className="ml-2 mt-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              {/* Define the content of the dropdown menu. */}
              <DropdownMenuContent align="center">
                {/* For each account, create a checkbox item in the dropdown menu. */}
                {account_names.map((account) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={account}
                      className="capitalize focus:bg-blue-300"
                      checked={selectedAccounts.includes(account)}
                      onCheckedChange={() => updateAccountSelection(account)}>
                      {account}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      {/* Container for the table. */}
      <div
        id="TableContainer"
        className="mt-2 rounded border-2 border-gray-300">
        <Table>
          {/* Define the top row of the table with the column labels. */}
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {/* Map over the columns (header groups) inside the react table header row. */}
                {headerGroup.headers.map((header) => {
                  return (
                    // Create a table head object using the current header id and column header.
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              // Iterate through the rows of the table to create the table body.
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  // Updates the row's background color depending on the selected state of the row.
                  className={`relative ${row.getIsSelected() ? 'bg-blue-100' : ''} hover:bg-blue-100`}
                  onClick={() => row.toggleSelected(!row.getIsSelected())}
                  style={{ cursor: 'pointer' }}>
                  {/* Iterate over the column values (cells) inside the current row. */}
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {/* Populate the new cell using the value from the current cell. */}
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              // If the table is empty (no rows), display a message to indicate there are no results.
              <TableRow id="EmptyTable">
                <TableCell
                  colSpan={reviewColumns.length}
                  className="relative pl-14 text-2xl font-bold mb:pl-0 mb:text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div
        id="ReviewTableOptionsContainer"
        className="flex items-center justify-between py-2">
        {/* Inform the user of the current rows displayed compared to the total rows fetched. */}
        <div
          id="SelectedAndCurrentRowsInfo"
          className="ml-2 mr-2 mt-0.5 p-2 text-center text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        {/* Pagination buttons for the table. Each page holds the header row and 10 transaction rows. */}
        <div
          id="PaginationButtonsContainer"
          className="grid grid-rows-2 space-y-1 sm:grid-cols-2 sm:grid-rows-1 sm:space-x-2 sm:space-y-0">
          <div>
            <Button
              id="PreviousPageButton"
              variant="outline"
              className="w-20 translate-y-12 border-2 border-gray-300 hover:border-blue-300 hover:bg-blue-100 sm:translate-y-0"
              size="sm"
              onClick={() => table.previousPage()}
              // Disable the button if the table cannot move to the previous page.
              disabled={!table.getCanPreviousPage()}>
              Previous
            </Button>
          </div>
          <div>
            <Button
              id="NextPageButton"
              variant="outline"
              size="sm"
              className="absolute w-20 -translate-y-10 border-2 border-gray-300 hover:border-blue-300 hover:bg-blue-100 sm:relative sm:translate-y-0"
              onClick={() => table.nextPage()}
              // Disable the button if the table cannot move to the next page.
              disabled={!table.getCanNextPage()}>
              Next
            </Button>
          </div>
        </div>
        <div className="ml-2">
          <Button
            id="SaveButton"
            onClick={() =>
              // Calls the handleSave function with the currently selected rows.
              handleSave(rowSelection, categorizedTransactions)
            }
            // Disable the button if the table is currently saving or no rows are selected.
            disabled={
              isSaving || table.getFilteredSelectedRowModel().rows.length === 0
            }
            className="ml-2 mr-4 h-12 w-24 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600">
            {/* Display either the save button text or a saving message depending on the saving state. */}
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
