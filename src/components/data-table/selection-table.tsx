/**
 * Defines how the table for the selection page is populated, functions, and displays.
 */
'use client';
import { useState, useEffect } from 'react';
import { selectionColumns } from './columns';
import type {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { DatePicker } from '@/components/date-picker';
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
import { ChevronDown } from 'lucide-react';
import type { Transaction } from '@/types/Transaction';

// Takes a list of transactions, a boolean indicating if the table is presently classifying, and a function to handle classification.
export function SelectionTable({
  transactions,
  account_names,
  isClassifying,
  handleClassify,
}: Readonly<{
  transactions: Transaction[];
  account_names: string[];
  isClassifying: boolean;
  handleClassify: (selectedRows: Transaction[]) => void;
}>) {
  // Create state to track and set the sorting state.
  const [sorting, setSorting] = useState<SortingState>([]);

  // Create state to track and set the currently filtered columns.
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Create state to track and set the column visibility state for each column.
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Create state to track and set the currently selected rows.
  const [rowSelection, setRowSelection] = useState({});

  // Create state to track and set the currently selected accounts.
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  // Define the default start and end date (two years ago and today).
  const currentDate = new Date();
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(currentDate.getFullYear() - 2);

  // Create state to track and set the start and end date for the date filter.
  const [startDate, setStartDate] = useState<Date | null>(twoYearsAgo);
  const [endDate, setEndDate] = useState<Date | null>(currentDate);

  // Define a function to handle changing the start date.
  function changeStartDate(date: Date | null) {
    // Update the date filter value with the new start date.
    table.getColumn('date')?.setFilterValue(`${date} to ${endDate}`);
    // Update the recorded start date value.
    setStartDate(date);
  }

  // Define a function to handle changing the end date.
  function changeEndDate(date: Date | null) {
    // Update the date filter value with the new end date.
    table.getColumn('date')?.setFilterValue(`${startDate} to ${date}`);
    // Update the recorded end date value.
    setEndDate(date);
  }

  // Function to update the account selection state.
  function updateAccountSelection(account: string) {
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
  }

  // Update the selected accounts state when the account names change.
  useEffect(() => {
    setSelectedAccounts(account_names);
  }, [account_names]);

  // Call the react table, passing in the passed transactions and the selection columns.
  const table = useReactTable({
    data: transactions,
    columns: selectionColumns,
    // Pass the set state functions to table actions.
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
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
      columnVisibility,
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
      <div
        id="TableFilterContainer"
        className="w-full grid grid-rows-2 mt-6 md:grid-rows-1 md:grid-cols-2">
        {/* Container for the name search input */}
        <div id="TextSearchContainer" className="mx-auto w-4/5 sm:w-3/4">
          {/* Create an input to take text and filter to transactions with matching names. */}
          <Input
            id="NameFilterInput"
            placeholder="Filter by name..."
            // Set the input value to the name filter value or an empty string if none is found.
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={event =>
              // When the input value changes, update the name filter value with the new value.
              table.getColumn('name')?.setFilterValue(event.target.value)
            }
            className="w-full border-2 border-gray-300"
          />
        </div>

        {/* Create a date picker to filter by date range. */}
        <div
          id="FilterSelectionContainer"
          className="flex items-center mx-auto w-11/12 md:w-5/6">
          <div className="w-full grid grid-cols-2 gap-x-6 mb:gap-x-12 sm:gap-x-16 md:gap-x-6 px-2 mt-2 md:mt-0">
            {/* Start and End Date pickers. */}
            <DatePicker date={startDate} setDate={changeStartDate} />
            <DatePicker date={endDate} setDate={changeEndDate} />
          </div>
        </div>
      </div>

      {/* Container for the accounts and columns filters */}
      <div
        id="FilterElementsContainer"
        className=" mx-auto grid grid-cols-2 gap-x-4 px-4 mt-8 popout:gap-x-6 md:gap-x-12 md:px-6 lg:px-8 lg:gap-x-20 xl:gap-x-24 xl:px-10">
        {/* Create a dropdown menu to select accounts to filter by. */}
        <DropdownMenu>
          {/* Create a button to trigger the dropdown menu. */}
          <DropdownMenuTrigger asChild>
            <Button
              id="AccountsDropdownButton"
              variant="outline"
              className="bg-blue-500 w-full hover:bg-blue-800 hover:text-white text-white">
              {/* Chevron down acts a down arrow icon */}
              Accounts <ChevronDown className="ml-2 mt-1 h-4 w-4" />
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

        {/* Define a dropdown menu to select which columns are displayed. */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {/* Button defines the base button that opens and closes the dropdown. */}
            <Button
              id="ColumnFilterButton"
              variant="outline"
              className="bg-blue-500 hover:bg-blue-800 hover:text-white text-white">
              {/* Chevron down acts a down arrow icon */}
              Columns <ChevronDown className="ml-2 mt-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          {/* Dropdown menu content defines what is shown in the dropdown */}
          <DropdownMenuContent align="center">
            {/* Gets the columns and filters to the ones that can be hidden then maps over them. */}
            {table
              .getAllColumns()
              .filter(column => column.getCanHide())
              .map(column => {
                // Get the name using the column ID.
                let field = column.id;
                // Rename transaction_type to Type.
                if (column.id === 'transaction_type') {
                  field = 'Type';
                }
                // Rename name column to Payee.
                if (column.id === 'name') {
                  field = 'Payee';
                }
                return (
                  // Create a checkbox item for each column that can be hidden.
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize focus:bg-blue-300"
                    // Checked status is determined by the associated column's visibility.
                    checked={column.getIsVisible()}
                    // On change, toggle the visibility of the associated column.
                    onCheckedChange={value => column.toggleVisibility(!!value)}>
                    {/* Display the field name for the column. */}
                    {field}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
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
                  colSpan={selectionColumns.length}
                  className="h-24 font-bold text-2xl pl-14 mb:pl-0 mb:text-center">
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
            id="ClassifyButton"
            onClick={() =>
              // When the classify button is clicked, call the handle classify function with the selected rows.
              handleClassify(
                table
                  .getFilteredSelectedRowModel()
                  .rows.map(row => row.original)
              )
            }
            // Disable the button if the table is currently classifying or no rows are selected.
            disabled={
              isClassifying ||
              table.getFilteredSelectedRowModel().rows.length === 0
            }
            className="bg-blue-500 hover:bg-blue-600 rounded font-bold text-white py-2 px-4 h-12 w-24 ml-2 mr-4">
            {isClassifying ? 'Classifying...' : 'Classify'}
          </Button>
        </div>
      </div>
    </div>
  );
}
