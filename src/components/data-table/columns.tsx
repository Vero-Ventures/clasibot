/**
 * Defines the columns used by the selection and review data tables.
 */
import type { Column, ColumnDef, Row, Table } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfidenceBar } from '@/components/ui/confidence-bar';
import type { Category, ClassifiedCategory } from '@/types/Category';
import type { CategorizedTransaction, Transaction } from '@/types/Transaction';
import { format } from 'date-fns';

// Define button for a sortable header
const sortableHeader = (
  column: Column<Transaction> | Column<CategorizedTransaction>,
  title: string
) => {
  return (
    <Button
      id={title + 'SortButton'}
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      className="p-0">
      {title}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
};

const commonColumns = [
  // Define the Select column.
  {
    id: 'select',
    header: ({
      table,
    }: {
      table: Table<Transaction> | Table<CategorizedTransaction>;
    }) => (
      // Row contains a checkboxe to select all or individual rows.
      <Checkbox
        // Check if all rows are selected (Checked), or if some or no rows are selected (Unchecked).
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        // Convert the checked value to a boolean then set the checked value of all rows to that value.
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({
      row,
    }: {
      row: Row<Transaction> | Row<CategorizedTransaction>;
    }) => (
      // Checkbox for an individual row.
      <Checkbox
        // Use the row value and getIsSelected to check if the row is selected.
        checked={row.getIsSelected()}
        // Use the row value and toggleSelected to toggle the selected value of the row.
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    // Disable sorting and hiding for the select column.
    enableSorting: false,
    enableHiding: false,
  },

  // Define the Date column
  {
    accessorKey: 'date',
    header: ({
      column,
    }: {
      column: Column<Transaction> | Column<CategorizedTransaction>;
    }) => sortableHeader(column, 'Date'),
    // The column is considered sortable, using the date as the title.
    cell: ({
      row,
    }: {
      row: Row<Transaction> | Row<CategorizedTransaction>;
    }) => {
      // Populate the date column with the date value from the row.
      const formattedDate = format(
        new Date(row.getValue('date')),
        'MM/dd/yyyy'
      );
      // Return the formatted date inside a div.
      return <div>{formattedDate}</div>;
    },
    // Define the function for date column
    filterFn: (
      row: Row<Transaction> | Row<CategorizedTransaction>,
      _: string,
      filterValue: string
    ) => {
      // Split the passed filter value into a start and end date using the string ' to '.
      // Convert the resulting strings into dates, or null if the string is empty.
      const [startDate, endDate] = filterValue
        .split(' to ')
        .map((date: string) => {
          if (!date) {
            return null;
          } else {
            return new Date(date);
          }
        });
      // Return true if the row date is within the range
      const rowDate = new Date(row.getValue('date'));
      // Determine if the row should be filtered out and return true or false.
      return (
        // Check if the start / end date exists or the row date is within the range -
        // - If either is true for both dates, return true.
        (!startDate || rowDate >= startDate) && (!endDate || rowDate <= endDate)
      );
    },
  },

  // Define the Type column
  {
    accessorKey: 'transaction_type',
    header: ({
      column,
    }: {
      column: Column<Transaction> | Column<CategorizedTransaction>;
    }) => sortableHeader(column, 'Type'),
    cell: ({ row }: { row: Row<Transaction> | Row<CategorizedTransaction> }) =>
      // Populate the column with the transaction type value from the row.
      row.getValue('transaction_type'),
  },

  // Define the Payee column
  {
    accessorKey: 'name',
    header: ({
      column,
    }: {
      column: Column<Transaction> | Column<CategorizedTransaction>;
    }) => sortableHeader(column, 'Payee'),
    cell: ({ row }: { row: Row<Transaction> | Row<CategorizedTransaction> }) =>
      // Populate the column with the name value from the row.
      row.getValue('name'),
  },

  // Define the Amount column
  {
    accessorKey: 'amount',
    header: ({
      column,
    }: {
      column: Column<Transaction> | Column<CategorizedTransaction>;
    }) => sortableHeader(column, 'Amount'),
    cell: ({
      row,
    }: {
      row: Row<Transaction> | Row<CategorizedTransaction>;
    }) => {
      // Convert the string amount value from the row to a float.
      const amount = parseFloat(row.getValue('amount'));
      // Format the amount as a currency in CAD.
      const formatted = new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: 'CAD',
      }).format(amount);
      // Return the formatted amount inside a div.
      return <div>{formatted}</div>;
    },
  },
];

// Define the columns for the selection table.
export const selectionColumns: ColumnDef<Transaction>[] = [
  // Define the order of the columns. Start with the select, date, type, payee, and account columns.
  commonColumns[0],
  commonColumns[1],
  commonColumns[2],
  commonColumns[3],

  // Define the Account column. Use a custom filter function to filter by account.
  {
    accessorKey: 'account',
    header: 'Account',
    cell: ({ row }: { row: Row<Transaction> | Row<CategorizedTransaction> }) =>
      row.getValue('account'),
    // Filter function takes a row and filter value as arguments. Also takes a column ID which is not used.
    // Column ID is needed to match the expected function signature.
    filterFn: (
      row: Row<Transaction> | Row<CategorizedTransaction>,
      columnId: string,
      filterValue: string
    ) => {
      // Filter values should be an array of strings, if no filter value is provided, return true.
      if (!filterValue || filterValue.length === 0) {
        return true;
      }
      // Check if the account value is included in the filter value array.
      // Return the result as a boolean value to determine filtering.
      return filterValue.includes(row.getValue('account'));
    },
  },

  // Define the Amount column from common columns.
  commonColumns[4],
];

// Define the columns for the review table.
export const reviewColumns = (
  selectedCategories: Record<string, string>,
  handleCategoryChange: (transaction_ID: string, category: string) => void
): ColumnDef<CategorizedTransaction>[] => [
  // Define the order of the columns. Start with the select, date, type, payee, and account columns.
  commonColumns[0],
  commonColumns[1],
  commonColumns[2],
  commonColumns[3],

  // Define the Account column. Use a custom filter function to filter by account.
  {
    accessorKey: 'account',
    header: 'Account',
    cell: ({ row }: { row: Row<Transaction> | Row<CategorizedTransaction> }) =>
      row.getValue('account'),
    // Filter function takes a row and filter value as arguments. Also takes a column ID which is not used.
    // Column ID is needed to match the expected function signature.
    filterFn: (
      row: Row<Transaction> | Row<CategorizedTransaction>,
      columnId: string,
      filterValue: string
    ) => {
      // Filter values should be an array of strings, if no filter value is provided, return true.
      if (!filterValue || filterValue.length === 0) {
        return true;
      }
      // Check if the account value is included in the filter value array.
      // Return the result as a boolean value to determine filtering.
      return filterValue.includes(row.getValue('account'));
    },
  },

  // Define the Categories column.
  {
    accessorKey: 'categories',
    header: 'Categories',
    cell: ({
      row,
    }: {
      row: Row<Transaction> | Row<CategorizedTransaction>;
    }) => {
      const categories: Category[] = row.getValue('categories');
      return categories.length > 0 ? (
        <select
          className="rounded-lg border border-gray-700 px-2 py-1"
          onClick={(e) => e.stopPropagation()}
          // If the user changes the category, call the handleCategoryChange function with the new value.
          // Needed to save the correct category when the transactions are saved.
          onChange={(e) => {
            handleCategoryChange(row.original.transaction_ID, e.target.value);
          }}
          value={selectedCategories[row.original.transaction_ID]}>
          {/* Map the categories associated with the transaction to a dropdown */}
          {categories.map((category) => (
            // Define the key, value, and display text using the categorization name.
            <option key={category.name} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
      ) : (
        // If no categories are found, display a message indicating none were found.
        <span className="text-red-500">No Categories Found</span>
      );
    },
  },

  // Define the amount column.
  commonColumns[4],

  // Define the Confidence column
  {
    accessorKey: 'confidence',
    header: 'Confidence',
    cell: ({
      row,
    }: {
      row: Row<Transaction> | Row<CategorizedTransaction>;
    }) => {
      // Define the confidence value assosiated with each classification method.
      const LLMClassified = 33;
      const DatabaseClassified = 66;
      const FuseClassified = 100;

      // Define confidence value as 0 to start.
      let confidenceValue = 0;

      // Define categories as the categories associated with the row.
      const categories: ClassifiedCategory[] = row.getValue('categories');

      // Determine the confidence value based on how the categories were determined.
      // Each method has an associated percentage: Fuse Match - 100%, Database Lookup - 66%, LLM Prediction - 33%.
      if (categories.length > 0) {
        // If any category is found, the lowest possible confidence value is 33% (LLM).
        confidenceValue = LLMClassified;
        // Iterate through the categories to determine the confidence value.
        for (const category of categories) {
          // If a database lookup is found, change the confidence value to 66%.
          if (category.classifiedBy === 'Database') {
            confidenceValue = DatabaseClassified;
            // Further iterations can only equal or increase the confidence value.
          }
          if (category.classifiedBy === 'Matching') {
            // If the category is classified by fuze match, change the confidence value to 100%.
            confidenceValue = FuseClassified;
            // Break the loop as the highest confidence value has been reached.
            break;
          }
        }
      }
      // Define a hover text based on the confidence value.
      let hoverText = '';
      if (confidenceValue === 0) {
        hoverText = 'No categorization results found.';
      }
      if (confidenceValue === LLMClassified) {
        hoverText = 'Results found by LLM prediction.';
      }
      if (confidenceValue === DatabaseClassified) {
        hoverText = 'Results found by database check.';
      }
      if (confidenceValue === FuseClassified) {
        hoverText = 'Results found by name matching.';
      }
      // Return a confidence bar with it's UI and hover text based on the confidence value.
      return (
        <ConfidenceBar confidence={confidenceValue} hoverText={hoverText} />
      );
    },
  },
];
