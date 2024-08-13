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
import type { CategorizedTransaction } from '@/types/Transaction';

// Takes a list of categorized transactions, a record containing the selected categories,
// a function to handle category changes, a function to handle saving, and a boolean indicating if the table is presently saving.
export function ReviewTable({
  categorizedTransactions,
  selectedCategories,
  account_names,
  handleCategoryChange,
  handleSave,
  isSaving,
}: Readonly<{
  categorizedTransactions: CategorizedTransaction[];
  selectedCategories: Record<string, string>;
  account_names: string[];
  handleCategoryChange: (transaction_ID: string, category: string) => void;
  handleSave: (selectedRows: CategorizedTransaction[]) => void;
  isSaving: boolean;
}>) {
  // Create state to track and set the sorting state.
  const [sorting, setSorting] = useState<SortingState>([]);

  // Create state to track and set the currently filtered columns.
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Create state to track and set the currently selected rows.
  const [rowSelection, setRowSelection] = useState({});

  // Create state to track and set the selected accounts.
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  // Function to update the account selection state.
  const updateAccountSelection = (account: string) => {
    // If the account is already selected, remove it from the selected accounts.
    if (selectedAccounts.includes(account)) {
      // Filter out the account from the selected accounts and set the state with the filtered array.
      setSelectedAccounts(
        selectedAccounts.filter(arrayAccount => arrayAccount !== account)
      );
    } else {
      // If the account is not selected, add it to the selected accounts and update the state.
      setSelectedAccounts([...selectedAccounts, account]);
    }
  };

  // Update the selected accounts state when the account names change.
  useEffect(() => {
    setSelectedAccounts(account_names);
  }, [account_names]);

  // Call the react table, passing in the categorized transactions and columns.
  const table = useReactTable({
    data: categorizedTransactions,
    columns: reviewColumns(selectedCategories, handleCategoryChange),
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

  // Update the table when the selected accounts change.
  useEffect(() => {
    // If no accounts are selected, set the account filter value to false to show all results.
    // No filter -> all strings contain '' -> all transactions (rows) are shown.
    if (selectedAccounts.length === 0) {
      table.getColumn('account')?.setFilterValue(() => false);
    }
    // If accounts are selected, set the account filter to the array of selected accounts.
    // Filter by accounts -> only show transactions (rows) with accounts in selectedAccounts.
    table.getColumn('account')?.setFilterValue(selectedAccounts);
  }, [selectedAccounts, table]);

  return (
    <div className="w-full">
      <div className="md:w-3/4 md:align-start  lg:w-5/6">
        <div className="flex justify-center py-4 px-2 mb:px-4 popout:px-6 md:justify-start lg:px-10">
          {/* Create an input to take text and filter to transactions with matching names. */}
          <Input
            id="NameFilterInput"
            placeholder="Filter by name..."
            // Set the input value to the name filter value or an empty string if none is found.
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            // When the input value changes, update the name filter value with the new value.
            onChange={event =>
              table.getColumn('name')?.setFilterValue(event.target.value)
            }
            className="max-w-xs mr-2 w-2/3 popout:mr-4 popout:w-1/2 md:w-2/3 md:mr-6"
          />
          <div className="max-w-48 ml-2 popout:ml-4 popout:w-1/4 md:w-1/3 md:ml-6">
            {/* Create a dropdown menu to select accounts to filter by. */}
            <DropdownMenu>
              {/* Create a button to trigger the dropdown menu. */}
              <DropdownMenuTrigger asChild>
                <Button
                  id="AccountsDropdownButton"
                  variant="outline"
                  className="bg-blue-500 w-full hover:bg-blue-800 hover:text-white text-white">
                  {/* Chevron down acts a down arrow icon */}
                  Accounts <ChevronDown className="h-4 mt-1 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              {/* Define the content of the dropdown menu. */}
              <DropdownMenuContent align="center">
                {/* For each account, create a checkbox item in the dropdown menu. */}
                {account_names.map(account => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={account}
                      className="capitalize focus:bg-blue-300"
                      // Set the checkbox item to checked if the account is in the selected accounts.
                      checked={selectedAccounts.includes(account)}
                      // When the checkbox is clicked, update the account selection state.
                      // Use eslint-disable-next-line to ignore the unused value warning which is needed for function format.
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                      onCheckedChange={() => updateAccountSelection(account)}>
                      {/* Display the account name */}
                      {account}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      {/* Container for the table */}
      <div
        id="TableContainer"
        className="rounded-md border-2 border-gray-300 rounded mt-2">
        <Table>
          {/* Define the top row of the table with the column labels. */}
          <TableHeader>
            {/* Get the header group to prepare the table header row. */}
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {/* Map over the columns (header groups) inside the react table header row. */}
                {headerGroup.headers.map(header => {
                  return (
                    // Create a table head object using the current header's id and column header.
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
            {/* If there are rows within the table, mao over them to create the rows. */}
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                //  Create a table row object for the current row.
                <TableRow
                  key={row.id}
                  // Sets the row's background color depending on the selected state of the row.
                  className={`${row.getIsSelected() ? 'bg-blue-100' : ''} hover:bg-blue-100`}
                  // When the row is clicked, toggle the selected state of the row.
                  onClick={() => row.toggleSelected(!row.getIsSelected())}
                  // Set the cursor to a pointer when hovering over the row.
                  style={{ cursor: 'pointer' }}>
                  {/* Iterate over the column values inside the row. */}
                  {row.getVisibleCells().map(cell => (
                    // Use the cell's id as the key for the table cell.
                    <TableCell key={cell.id}>
                      {/* Populate the table cell using the value for that cell from the current row */}
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              // If there are no rows in the table, instead displays a message indicating there are no results.
              <TableRow>
                <TableCell
                  colSpan={reviewColumns.length}
                  className="font-bold text-2xl pl-14 mb:pl-0 mb:text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination buttons for the table, each page holds 10 rows + the header row. */}
      <div className="flex items-center justify-between py-2">
        <div
          id="SelectedAndCurrentRowsInfo"
          className=" text-sm text-muted-foreground mt-0.5 ml-2 mr-2 text-center p-2">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div
          id="PaginationButtonsContainer"
          className="grid grid-rows-2 space-y-1 sm:grid-rows-1 sm:grid-cols-2 sm:space-y-0 sm:space-x-2">
          <div>
            <Button
              id="PreviousPageButton"
              variant="outline"
              className="translate-y-12 sm:translate-y-0 border-2 border-gray-300 hover:border-blue-300 hover:bg-blue-100 w-20"
              size="sm"
              // When the previous page button is clicked, move to the previous page.
              onClick={() => table.previousPage()}
              // Disable the button if the table cannot move to the previous page
              disabled={!table.getCanPreviousPage()}>
              Previous
            </Button>
          </div>
          <div>
            <Button
              id="NextPageButton"
              variant="outline"
              size="sm"
              className="absolute -translate-y-10 sm:translate-y-0 sm:relative border-2 border-gray-300 hover:border-blue-300 hover:bg-blue-100 w-20"
              // When the next page button is clicked, move to the next page.
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
              // When the save button is clicked, call the handleSave function with the selected rows.
              handleSave(
                table
                  .getFilteredSelectedRowModel()
                  .rows.map(row => row.original)
              )
            }
            // Disable the button if the table is currently saving or no rows are selected.
            disabled={
              isSaving || table.getFilteredSelectedRowModel().rows.length === 0
            }
            className="bg-blue-500 hover:bg-blue-600 rounded font-bold text-white py-2 px-4  h-12 w-24 ml-2 mr-4">
            {/* Display either a the save button text or a saving message depending on the saving state. */}
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
