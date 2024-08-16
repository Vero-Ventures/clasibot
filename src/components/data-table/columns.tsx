import type { Column, ColumnDef, Row, Table } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfidenceBar } from '@/components/confidence-bar';
import type { Category, ClassifiedCategory } from '@/types/Category';
import type { CategorizedTransaction, Transaction } from '@/types/Transaction';
import { format } from 'date-fns';

// Define button format for a sortable header
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
      // Row contains a checkbox to select all or individual rows.
      <Checkbox
        // Check if all rows are selected (Checked), or if some / no rows are selected (Unchecked).
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
        // When checked status changes, toggle the selection value.
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    // Disable sorting and hiding for the select column.
    enableSorting: false,
    enableHiding: false,
  },

  // Define the Date column.
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
      // Convert the date value from the row to a Month-Day-Year format.
      const formattedDate = format(
        new Date(row.getValue('date')),
        'MM/DD/YYYY'
      );
      return <div>{formattedDate}</div>;
    },
    // Define a filter function for date column
    filterFn: (
      row: Row<Transaction> | Row<CategorizedTransaction>,
      _: string,
      filterValue: string
    ) => {
      // Use the string  ' to ' to split the filter value into a start and end date.
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
      // Convert the row's date into a date object for comparison.
      const rowDate = new Date(row.getValue('date'));
      return (
        // Check if the date does not exist or if the row date is within the correct side of the filter date -
        // - If either is true for both the start and end dates, return true.
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
      row.getValue('transaction_type'),
  },

  // Define the Payee / Name column
  {
    accessorKey: 'name',
    header: ({
      column,
    }: {
      column: Column<Transaction> | Column<CategorizedTransaction>;
    }) => sortableHeader(column, 'Payee'),
    cell: ({ row }: { row: Row<Transaction> | Row<CategorizedTransaction> }) =>
      row.getValue('name'),
  },

  // Define the Account column. Uses a custom filter function to filter by account.
  {
    accessorKey: 'account',
    header: 'Account',
    cell: ({ row }: { row: Row<Transaction> | Row<CategorizedTransaction> }) =>
      row.getValue('account'),
    // Filter function takes the rows value and an array of account names (filterValue).
    // Column ID is needed to match the expected function signature for filter function to work.
    filterFn: (
      row: Row<Transaction> | Row<CategorizedTransaction>,
      columnId: string,
      filterValue: string
    ) => {
      // Filter values should be an array of strings.
      // If no filter value is provided, return true to display all rows.
      if (!filterValue || filterValue.length === 0) {
        return true;
      }
      // Check if the account value is included in the filter value array.
      // Return the result as a boolean value to determine filtering.
      return filterValue.includes(row.getValue('account'));
    },
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
  // Define the order of the columns using the common columns define above.
  commonColumns[0],
  commonColumns[1],
  commonColumns[2],
  commonColumns[3],
  commonColumns[4],
  commonColumns[5],
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
  commonColumns[4],

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
          // Use a callback function (handleCategoryChange) when selected category for a row changes.
          // Allows the correct category to be recorded when the transactions are saved.
          onChange={(e) => {
            handleCategoryChange(row.original.transaction_ID, e.target.value);
          }}
          value={selectedCategories[row.original.transaction_ID]}>
          {/* Map the categories associated with the transaction to a dropdown */}
          {categories.map((category) => (
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

  // Define the Confidence column
  {
    accessorKey: 'confidence',
    header: 'Confidence',
    cell: ({
      row,
    }: {
      row: Row<Transaction> | Row<CategorizedTransaction>;
    }) => {
      // Define the inital confidence value as well as the value for each classification method.
      const LLMClassified = 33;
      const DatabaseClassified = 66;
      const FuseClassified = 100;
      let confidenceValue = 0;

      const categories: ClassifiedCategory[] = row.getValue('categories');

      // Determine the highest confidence value present from how the categories were determined.
      if (categories.length > 0) {
        // If any category is found, the lowest possible confidence value is 33% (LLM).
        confidenceValue = LLMClassified;
        // Iterate through the categories to determine the confidence value.
        for (const category of categories) {
          // If a database lookup is found, change minimum confidence value to 66%.
          // Further iterations can only equal or increase the confidence value.
          if (category.classifiedBy === 'Database') {
            confidenceValue = DatabaseClassified;
          }
          // If the category is classified by fuze match, change the confidence value to 100%.
          // Then break the loop as the highest confidence value has been reached.
          if (category.classifiedBy === 'Matching') {
            confidenceValue = FuseClassified;
            break;
          }
        }
      }
      // Determine the hover text to display ontop of the confidence bar.
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
      // Create and return a confidence bar with it's values determined by the confidence value.
      return (
        <ConfidenceBar confidence={confidenceValue} hoverText={hoverText} />
      );
    },
  },
];
