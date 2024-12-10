'use client';

import { ArrowUp, ArrowDown } from 'lucide-react';

import { format } from 'date-fns';

import type { Column, ColumnDef, Row, Table } from '@tanstack/react-table';

import { ConfidenceBar } from '@/components/site-elements/index';

import { Button, Checkbox } from '@/components/ui/index';

import type {
  Classification,
  FormattedForReviewTransaction,
  ClassifiedForReviewTransaction,
} from '@/types/index';

// Define button format for a sortable Column header.
function sortableHeader(
  column:
    | Column<FormattedForReviewTransaction>
    | Column<ClassifiedForReviewTransaction>,
  title: string
) {
  return (
    <Button
      id={title + 'SortButton'}
      variant="ghost"
      onClick={() => {
        column.toggleSorting(column.getIsSorted() !== 'desc');
      }}
      className="ml-2 px-3 font-semibold hover:!bg-gray-200 hover:!bg-opacity-40">
      {title}
      {column.getIsSorted() === 'asc' ? (
        <ArrowUp
          className={`ml-2 h-5 w-5 ${column.getIsSorted() ? 'stroke-blue-600' : 'stroke-gray-500'}`}
        />
      ) : (
        <ArrowDown
          className={`ml-2 h-5 w-5 ${column.getIsSorted() ? 'stroke-blue-600' : 'stroke-gray-500'}`}
        />
      )}
    </Button>
  );
}

const commonColumns = [
  // Define the Select Column - Box that indiates if the Row is selected.
  {
    id: 'select',
    header: ({
      table,
    }: {
      table:
        | Table<FormattedForReviewTransaction>
        | Table<ClassifiedForReviewTransaction>;
    }) => (
      // Column header Row contains a checkbox to select all Rows.
      <Checkbox
        // Check if all Rows are selected (Checked), or not (Unchecked).
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        // Convert the checked value from a string to a boolean, then set that as the checked value of all Rows.
        onCheckedChange={(value: boolean) =>
          table.toggleAllPageRowsSelected(!!value)
        }
        aria-label="Select all"
      />
    ),
    cell: ({
      row,
    }: {
      row:
        | Row<FormattedForReviewTransaction>
        | Row<ClassifiedForReviewTransaction>;
    }) => (
      // Checkbox for an individual Row.
      <Checkbox
        // Use the Row value and getIsSelected to check if the Row is selected.
        checked={row.getIsSelected()}
        // When checked status changes, toggle the selection value of the Row.
        onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    // Disable sorting and Column hiding.
    enableSorting: false,
    enableHiding: false,
  },

  // Define the Account Column.
  // Uses a custom filter function to enable a Account filtering.
  {
    accessorKey: 'accountName',
    header: 'Account',
    cell: ({
      row,
    }: {
      row:
        | Row<FormattedForReviewTransaction>
        | Row<ClassifiedForReviewTransaction>;
    }) => (
      <span className="inline-block max-w-32 overflow-hidden overflow-ellipsis">
        {row.getValue('accountName')}
      </span>
    ),
    // Filter function takes the Row value and an array of Account names (filterValue).
    //    Column Id is needed to match the expected function signature.
    filterFn: (
      row:
        | Row<FormattedForReviewTransaction>
        | Row<ClassifiedForReviewTransaction>,
      columnId: string,
      filterValue: string
    ) => {
      // Filter values should be an array of strings.
      // If no filter value is provided or no Accounts were selected, display all Rows.
      if (!filterValue || filterValue.length === 0) {
        return true;
      }
      // Check if the Account name is included the array of selected Account names.
      // Return the result as a boolean value to determine Row filtering.
      return filterValue.includes(row.getValue('accountName'));
    },
    enableSorting: false,
  },

  // Define the Date Column.
  {
    accessorKey: 'date',
    header: ({
      column,
    }: {
      column:
        | Column<FormattedForReviewTransaction>
        | Column<ClassifiedForReviewTransaction>;
    }) => sortableHeader(column, 'Date'),
    // The Column is considered sortable.
    cell: ({
      row,
    }: {
      row:
        | Row<FormattedForReviewTransaction>
        | Row<ClassifiedForReviewTransaction>;
    }) => {
      // Convert the date value from the Row to a Month-Day-Year format.
      const formattedDate = format(
        Date.parse(row.getValue('date')),
        'MM/dd/yyyy'
      );
      return <div>{formattedDate}</div>;
    },
    // Define a filter function for date Column.
    filterFn: (
      row:
        | Row<FormattedForReviewTransaction>
        | Row<ClassifiedForReviewTransaction>,
      _: string,
      filterValue: string
    ) => {
      // Use the string  ' to ' to split the passed filter value into a start and end date.
      // Then converts the resulting strings into dates, or null values if the string is empty.
      const [startDate, endDate] = filterValue
        .split(' to ')
        .map((date: string) => {
          if (!date) {
            return null;
          } else {
            return new Date(date);
          }
        });
      // Convert the Row's date into an object for comparison.
      const rowDate = new Date(row.getValue('date'));
      return (
        // Check if the date is between the start and end dates.
        //    If the start / end date is not present, count that check as valid.
        (!startDate || rowDate >= startDate) && (!endDate || rowDate <= endDate)
      );
    },
  },

  // Define the Name Column
  {
    accessorKey: 'name',
    header: ({
      column,
    }: {
      column:
        | Column<FormattedForReviewTransaction>
        | Column<ClassifiedForReviewTransaction>;
    }) => sortableHeader(column, 'Description'),
    cell: ({
      row,
    }: {
      row:
        | Row<FormattedForReviewTransaction>
        | Row<ClassifiedForReviewTransaction>;
    }) => (
      <span className="inline-block max-w-32 overflow-hidden overflow-ellipsis">
        {row.getValue('name')}
      </span>
    ),
  },

  // Define the Amount Column
  {
    accessorKey: 'amount',
    header: ({
      column,
    }: {
      column:
        | Column<FormattedForReviewTransaction>
        | Column<ClassifiedForReviewTransaction>;
    }) => sortableHeader(column, 'Amount'),
    cell: ({
      row,
    }: {
      row:
        | Row<FormattedForReviewTransaction>
        | Row<ClassifiedForReviewTransaction>;
    }) => {
      // Convert the string Amount value from the Row to a float.
      const amount = parseFloat(row.getValue('amount'));
      // Format the Amount as currency in CAD.
      const formatted = new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: 'CAD',
      }).format(amount);
      // Display the formatted Amount.
      return <div>{formatted}</div>;
    },
  },
];

// Define the Columns for the Review Table.
// Takes: Two records for the Classifications and handlers for updating the selected Classification for a specific Row.
// Returns: The definition for the Columns to display in the review Table.
export const ReviewColumns = (
  selectedCategories: Record<string, string>,
  selectedTaxCodes: Record<string, string>,
  handleCategoryChange: (transaction_Id: string, category: string) => void,
  handleTaxCodeChange: (transaction_Id: string, taxCode: string) => void
): ColumnDef<ClassifiedForReviewTransaction>[] => [
  // Define the order of the Columns. Start with the select, account, name, date, and amount Columns.
  commonColumns[0],
  commonColumns[1],
  commonColumns[2],
  commonColumns[3],
  commonColumns[4],

  // Define the Categories Column.
  {
    accessorKey: 'categories',
    header: 'Categories',
    cell: ({ row }: { row: Row<ClassifiedForReviewTransaction> }) => {
      let categories: Classification[] | null = row.getValue('categories');
      // If no Catagories are found (null), treat it the same as an empty array.
      if (!categories) {
        categories = [];
      }
      return categories.length > 0 ? (
        <select
          className="max-w-40 overflow-ellipsis rounded-lg border border-gray-700 px-2 py-1"
          onClick={(e) => e.stopPropagation()}
          // Use a callback function (handleCategoryChange) when the selected Category for a row changes.
          //    Updates the selected Categories for each Transaction in the Review Page.
          onChange={(e) => {
            handleCategoryChange(row.original.transaction_Id, e.target.value);
          }}
          value={selectedCategories[row.original.transaction_Id]}>
          {/* Map the Categories associated with the Transaction to a dropdown */}
          {categories.map((category) => (
            <option key={category.name} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
      ) : (
        // If no Categories are found, display a message indicating none were found.
        <span className="text-red-500">No Categories Found</span>
      );
    },
    enableSorting: false,
  },

  // Define the Category Confidence Column
  {
    accessorKey: 'categoryConfidence',
    header: ({ column }: { column: Column<ClassifiedForReviewTransaction> }) =>
      sortableHeader(column, 'Confidence (Category)'),
    cell: ({ row }: { row: Row<ClassifiedForReviewTransaction> }) => {
      // Get the confidence value from the row and use it to determine the Confidence Bar hover text.
      const confidenceValue: number = row.getValue('categoryConfidence');
      let hoverText = '';
      if (confidenceValue === 0) {
        hoverText = 'No Classification results found.';
      }
      if (confidenceValue === 1) {
        hoverText = 'Results found by LLM prediction.';
      }
      if (confidenceValue === 2) {
        hoverText = 'Results found by database check.';
      }
      if (confidenceValue === 3) {
        hoverText = 'Results found by name matching.';
      }
      return (
        <ConfidenceBar confidence={confidenceValue} hoverText={hoverText} />
      );
    },
  },

  // Define the Tax Codes Column.
  {
    accessorKey: 'taxCodes',
    header: 'Tax Codes',
    cell: ({ row }: { row: Row<ClassifiedForReviewTransaction> }) => {
      let taxCodes: Classification[] | null = row.getValue('taxCodes');
      // If no Tax Codes are found (null), treat it the same as an empty array.
      if (!taxCodes) {
        taxCodes = [];
      }
      return taxCodes.length > 0 ? (
        <select
          className="max-w-40 overflow-ellipsis rounded-lg border border-gray-700 px-2 py-1"
          onClick={(e) => e.stopPropagation()}
          // Use a callback function (handleTaxCodeChange) when the selected Tax Code for a row changes.
          //    Updates the selected Tax Codes for each Transaction in the Review Page.
          onChange={(e) => {
            handleTaxCodeChange(row.original.transaction_Id, e.target.value);
          }}
          value={selectedTaxCodes[row.original.transaction_Id]}>
          {/* Map the Tax Codes associated with the Transaction to a dropdown */}
          {taxCodes.map((taxCodes) => (
            <option key={taxCodes.name} value={taxCodes.name}>
              {taxCodes.name}
            </option>
          ))}
        </select>
      ) : (
        // If no Tax Codes are found, display a message indicating none were found.
        <span className="text-red-500">No Categories Found</span>
      );
    },
    enableSorting: false,
  },

  // Define the Tax Code Confidence Column
  {
    accessorKey: 'taxCodeConfidence',
    header: ({ column }: { column: Column<ClassifiedForReviewTransaction> }) =>
      sortableHeader(column, 'Confidence (Tax Code)'),
    cell: ({ row }: { row: Row<ClassifiedForReviewTransaction> }) => {
      // Get the confidence value from the row and use it to determine the Confidence Bar hover text.
      const confidenceValue: number = row.getValue('taxCodeConfidence');
      let hoverText = '';
      if (confidenceValue === 0) {
        hoverText = 'No Classification results found.';
      }
      if (confidenceValue === 1) {
        hoverText = 'Results found by LLM prediction.';
      }
      if (confidenceValue === 2) {
        hoverText = 'Results found by database check.';
      }
      if (confidenceValue === 3) {
        hoverText = 'Results found by name matching.';
      }
      return (
        <ConfidenceBar confidence={confidenceValue} hoverText={hoverText} />
      );
    },
  },
];
