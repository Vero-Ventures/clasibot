'use client';
import { useState, useEffect } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { ColumnFiltersState, SortingState } from '@tanstack/react-table';
import { ChevronDown } from 'lucide-react';
import { DatePicker } from '@/components/inputs/index';
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
  ClassifiedForReviewTransaction,
} from '@/types/index';

/**
 * Takes (Variables):
 * A list of Classified 'For Review' transactions, a record of the selected Classifications,
 * A list of Account names, and a bolean value to indicate if saving is in progress,
 * Boolean value indicating if manual Classification is in progress and a string indicateing its current state.
 *
 * Takes (Callbacks): Handlers for the Classification and saving processes.
 */
export function ReviewTable({
  categorizedTransactions,
  selectedCategories,
  selectedTaxCodes,
  account_names,
  handleCategoryChange,
  handleTaxCodeChange,
  handleSave,
  isSaving,
  handleManualClassification,
  isClassifying,
  manualClassificationState,
}: Readonly<{
  categorizedTransactions: (
    | ForReviewTransaction
    | ClassifiedForReviewTransaction
  )[][];
  selectedCategories: Record<string, string>;
  selectedTaxCodes: Record<string, string>;
  account_names: string[];
  handleCategoryChange: (transaction_Id: string, category: string) => void;
  handleTaxCodeChange: (transaction_Id: string, taxCode: string) => void;
  handleSave: (
    selectedRows: Record<number, boolean>,
    transactions: (ClassifiedForReviewTransaction | ForReviewTransaction)[][]
  ) => void;
  isSaving: boolean;
  handleManualClassification: () => void;
  manualClassificationState: string;
  isClassifying: boolean;
}>) {
  // Create states to track and set key Table values.
  // Column to sort by, Column filtering rules, selected Rows, and selected display Accounts.
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

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

  // Update the Account selection state for Account based filtering.
  const updateAccountSelection = (account: string) => {
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
  };

  // Update the selected Accounts list whenever there is a change to the list of Account names.
  useEffect(() => {
    setSelectedAccounts(account_names);
  }, [account_names]);

  // Extract the formatted Transactions from the [Classified, Raw] formatted array.
  const formattedTransactions: ClassifiedForReviewTransaction[] = [];
  for (const transaction of categorizedTransactions) {
    // Assert the object type as it is being added to the array.
    formattedTransactions.push(
      transaction[0] as ClassifiedForReviewTransaction
    );
  }

  // Creates the React Table using the passed data, helper functions, and states.
  const table = useReactTable({
    // Pass the Transactions as data, a list of Columns, and the Classification update handlers.
    data: formattedTransactions,
    columns: reviewColumns(
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

  // Placeholders for manual review state handling implementation.
  useEffect(() => {}, [isClassifying]);
  useEffect(() => {}, [manualClassificationState]);

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
      <div className="mx-auto w-fit">
        <Button
          id="TestManualClassification"
          className="h-12 w-40 self-center rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
          onClick={() => handleManualClassification()}>
          Test Manual Classification
        </Button>
      </div>
      <div
        id="TopFiltersContainer"
        className="mt-6 grid w-full grid-rows-2 md:grid-cols-2 md:grid-rows-1">
        <Input
          id="NameFilterInput"
          placeholder="Filter by name..."
          // Set the input value to the name filter value from the table (or an empty string).
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          // When the input value changes, update the name filter value with the new value.
          onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
          }
          className="mr-2 w-2/3 max-w-xs popout:mr-4 popout:w-1/2 md:mr-6 md:w-2/3"
        />
        <div
          id="DateSelectionContainer"
          className="mx-auto flex w-11/12 items-center md:w-5/6">
          <div className="mt-2 grid w-full grid-cols-2 gap-x-6 px-2 mb:gap-x-12 sm:gap-x-16 md:mt-0 md:gap-x-6">
            <DatePicker date={startDate} setDate={changeStartDate} />
            <DatePicker date={endDate} setDate={changeEndDate} />
          </div>
        </div>
      </div>

      <div
        id="BottomFiltersContainer"
        className="mx-auto mt-8 grid grid-cols-2 gap-x-4 px-4 popout:gap-x-6 md:gap-x-12 md:px-6 lg:gap-x-20 lg:px-8 xl:gap-x-24 xl:px-10">
        <div
          id="AccountFilter"
          className="ml-2 max-w-48 popout:ml-4 popout:w-1/4 md:ml-6 md:w-1/3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                id="AccountsDropdownButton"
                variant="outline"
                className="w-full bg-blue-500 text-white hover:bg-blue-800 hover:text-white">
                {/* Chevron down acts a down arrow icon */}
                Accounts <ChevronDown className="ml-2 mt-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              {/* For each Account, create a checkbox item in the dropdown menu. */}
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              id="ColumnFilterButton"
              variant="outline"
              className="bg-blue-500 text-white hover:bg-blue-800 hover:text-white">
              {/* Chevron down acts a down arrow icon */}
              Columns <ChevronDown className="ml-2 mt-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            {/* Gets a list of the Columns and filters out the ones that cannot be hidden. */}
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                // Get the name of the column using the Column Id.
                let field = column.id;
                // Rename 'name' Column to 'Payee'.
                if (column.id === 'name') {
                  field = 'Payee';
                }
                return (
                  // Create a checkbox item for each Column that can be hidden.
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize focus:bg-blue-300"
                    // Checked status is determined by the associated Column's visibility state.
                    checked={column.getIsVisible()}
                    // On change, toggle the visibility of the associated Column.
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

      <div
        id="TableContainer"
        className="mt-2 rounded border-2 border-gray-300">
        <Table>
          {/* Define the top row of the Table with the Column labels. */}
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {/* Map over the Columns (header groups) inside the react Table header row. */}
                {headerGroup.headers.map((header) => {
                  return (
                    // Create a Table head object using the current header id and Column header.
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
              // Iterate through the rows of the Table to create the Table body.
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  // Set the Row's background color depending on the selected state.
                  className={`relative ${row.getIsSelected() ? 'bg-blue-100' : ''} hover:bg-blue-100`}
                  onClick={() => row.toggleSelected(!row.getIsSelected())}
                  style={{ cursor: 'pointer' }}>
                  {/* Iterate over the Column values (cells) inside the current Row. */}
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              // If the Table is empty (no Tows), display a message to indicate there are no results.
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
        {/* Inform the user of the current Rows displayed compared to the total Rows fetched. */}
        <div
          id="SelectedAndCurrentRowsInfo"
          className="ml-2 mr-2 mt-0.5 p-2 text-center text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        {/* Pagination buttons for the table. Each page holds the header row and 10 Transaction rows. */}
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
              disabled={!table.getCanNextPage()}>
              Next
            </Button>
          </div>
        </div>
        <div className="ml-2">
          <Button
            id="SaveButton"
            onClick={() => handleSave(rowSelection, categorizedTransactions)}
            disabled={
              isSaving || table.getFilteredSelectedRowModel().rows.length === 0
            }
            className="ml-2 mr-4 h-12 w-24 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600">
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
