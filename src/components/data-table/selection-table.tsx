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
import { DatePicker } from '@/components/inputs/date-picker';
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

// Function Values: list of transactions, list of account names, and a value to indicate classification is in progress.
// Function Callbacks: A function to handle classifing the transactions.
export function SelectionTable({
  transactions,
  account_names,
  found_transactions,
  finished_loading,
  isClassifying,
  handleClassify,
}: Readonly<{
  transactions: Transaction[];
  account_names: string[];
  found_transactions: boolean;
  finished_loading: boolean;
  isClassifying: boolean;
  handleClassify: (selectedRows: Transaction[]) => void;
}>) {
  // Create states to track and set the important values.
  // Column to sort by, column filtering rules, Columns to display, selected Rows, and accounts to display Rows from.
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  // Define the default start and end date (two years ago & today).
  const currentDate = new Date();
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(currentDate.getFullYear() - 2);

  // Create state to track and set the start and end dates for the date filter.
  const [startDate, setStartDate] = useState<Date | null>(twoYearsAgo);
  const [endDate, setEndDate] = useState<Date | null>(currentDate);

  function changeStartDate(date: Date | null) {
    table.getColumn('date')?.setFilterValue(`${date} to ${endDate}`);
    setStartDate(date);
  }

  function changeEndDate(date: Date | null) {
    table.getColumn('date')?.setFilterValue(`${startDate} to ${date}`);
    setEndDate(date);
  }

  function updateAccountSelection(account: string) {
    // If the account is selected: Filter it out and update the selected accounts state.
    if (selectedAccounts.includes(account)) {
      setSelectedAccounts(
        selectedAccounts.filter((arrayAccount) => arrayAccount !== account)
      );
    } else {
      // Otherwise, add it to the selected accounts and update the state.
      setSelectedAccounts([...selectedAccounts, account]);
    }
  }

  // Updates the 'selected accounts' state whenever the 'account names' value changes.
  useEffect(() => {
    setSelectedAccounts(account_names);
  }, [account_names]);

  // Creates the react table using passed data, helper functions, and state elements.
  const table = useReactTable({
    // Pass the list of transactions for the rows and the list of columns to display.
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

  // Update the account filter in the table when the selected accounts change.
  useEffect(() => {
    // If no accounts are selected, set the account filter value to false to show all results.
    if (selectedAccounts.length === 0) {
      table.getColumn('account')?.setFilterValue(() => false);
    }
    // Otherwise update the filter function with the new array of account names.
    table.getColumn('account')?.setFilterValue(selectedAccounts);
  }, [selectedAccounts, table]);

  const handleClick = (event: React.MouseEvent) => {
    if (
      !finished_loading ||
      !found_transactions ||
      table.getRowModel().rows?.length == 0
    ) {
      event.stopPropagation();
    }
  };

  // Create state to track if all loading is finished to allow users to interact with selection table.
  const [tableReady, setTableReady] = useState(false);

  // Track loading elements and set table ready based on their values.
  useEffect(() => {
    if (
      finished_loading &&
      found_transactions &&
      table.getRowModel().rows?.length !== 0
    ) {
      if (process.env.APP_CONFIG !== 'production') {
        // Development: Wait to allow table to properly load and prevent freezing on local hosting.
        const timeout = setTimeout(() => {
          setTableReady(true);
        }, 1500);
        // Cleanup function to clear the timeout.
        return () => clearTimeout(timeout);
      } else {
        console.log(process.env.APP_CONFIG)
        // Production: Set table ready state to true.
        setTableReady(true);
      }
    }
  }, [found_transactions, finished_loading, table]);

  return (
    <div
      className="w-full"
      onClick={handleClick}
      style={{
        pointerEvents: tableReady ? 'auto' : 'none',
      }}>
      {/* Container for the top row of filters: name and date. */}
      <div
        id="TopFiltersContainer"
        className="mt-6 grid w-full grid-rows-2 md:grid-cols-2 md:grid-rows-1">
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
        {/* Create a date picker to fetch transactions by date range. */}
        <div
          id="DateSelectionContainer"
          className="mx-auto flex w-11/12 items-center md:w-5/6">
          <div className="mt-2 grid w-full grid-cols-2 gap-x-6 px-2 mb:gap-x-12 sm:gap-x-16 md:mt-0 md:gap-x-6">
            {/* Start and End Date pickers. */}
            <DatePicker date={startDate} setDate={changeStartDate} />
            <DatePicker date={endDate} setDate={changeEndDate} />
          </div>
        </div>
      </div>

      {/* Container for bottom row of filters: accounts and columns. */}
      <div
        id="BottomFiltersContainer"
        className="mx-auto mt-8 grid grid-cols-2 gap-x-4 px-4 popout:gap-x-6 md:gap-x-12 md:px-6 lg:gap-x-20 lg:px-8 xl:gap-x-24 xl:px-10">
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

        {/* Define a dropdown menu to select which columns are displayed. */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {/* Define a button to trigger the dropdown menu. */}
            <Button
              id="ColumnFilterButton"
              variant="outline"
              className="bg-blue-500 text-white hover:bg-blue-800 hover:text-white">
              {/* Chevron down acts a down arrow icon */}
              Columns <ChevronDown className="ml-2 mt-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          {/* Define the content of the dropdown menu. */}
          <DropdownMenuContent align="center">
            {/* Gets the columns and filters out the ones that cannot be hidden. */}
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
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
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }>
                    {field}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
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
            {table.getRowModel().rows?.length != 0 &&
            finished_loading &&
            found_transactions ? (
              // Iterate through the rows of the table to create the table body.
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  // Updates the row's background color depending on the selected state of the row.
                  className={`${row.getIsSelected() ? 'bg-blue-100' : ''} hover:bg-blue-100`}
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
                  colSpan={selectionColumns.length}
                  className="pl-14 text-2xl font-bold mb:pl-0 mb:text-center">
                  {found_transactions && finished_loading
                    ? 'No results found.'
                    : 'Loading...'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination buttons for the table, each page holds 10 rows + the header row. */}
      <div
        id="SelectionTableButtonsContainer"
        className="flex items-center justify-between py-2">
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
            id="ClassifyButton"
            onClick={() =>
              // Calls the handleClassify function with the currently selected rows.
              handleClassify(
                table
                  .getFilteredSelectedRowModel()
                  .rows.map((row) => row.original)
              )
            }
            // Disable the button if the table is currently classifying or no rows are selected.
            disabled={
              isClassifying ||
              table.getFilteredSelectedRowModel().rows.length === 0
            }
            className="ml-2 mr-4 h-12 w-24 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600">
            {/* Display either the classify button text or a classifing message depending on the classifing state. */}
            {isClassifying ? 'Classifying...' : 'Classify'}
          </Button>
        </div>
      </div>
    </div>
  );
}
