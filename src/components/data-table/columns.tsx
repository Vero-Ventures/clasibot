import { ArrowUpDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Column, ColumnDef, Row, Table } from '@tanstack/react-table';
import { ConfidenceBar } from '@/components/confidence-bar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { Classification, ClassifiedElement } from '@/types/Classification';
import type {
  FormattedForReviewTransaction,
  ClassifiedForReviewTransaction,
} from '@/types/ForReviewTransaction';

// Define button format for a sortable Column header.
const sortableHeader = (
  column:
    | Column<FormattedForReviewTransaction>
    | Column<ClassifiedForReviewTransaction>,
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
        // Convert the checked value to a boolean, then set that as the checked value of all Rows.
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    // Disable sorting and Column hiding.
    enableSorting: false,
    enableHiding: false,
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
        parseISO(row.getValue('date')),
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
      // Convert the resulting strings into dates, or null values if the string is empty.
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
        //    If the start / end date is not present, count that as valid as well.
        (!startDate || rowDate >= startDate) && (!endDate || rowDate <= endDate)
      );
    },
  },

  // Define the Payee / Name Column
  {
    accessorKey: 'name',
    header: ({
      column,
    }: {
      column:
        | Column<FormattedForReviewTransaction>
        | Column<ClassifiedForReviewTransaction>;
    }) => sortableHeader(column, 'Payee'),
    cell: ({
      row,
    }: {
      row:
        | Row<FormattedForReviewTransaction>
        | Row<ClassifiedForReviewTransaction>;
    }) => row.getValue('name'),
  },

  // Define the Account Column.
  // Uses a custom filter function to work with a dropdown that defines which Accounts are shown.
  {
    accessorKey: 'accountName',
    header: 'Account',
    cell: ({
      row,
    }: {
      row:
        | Row<FormattedForReviewTransaction>
        | Row<ClassifiedForReviewTransaction>;
    }) => row.getValue('accountName'),
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
      // Return the formatted Amount.
      return <div>{formatted}</div>;
    },
  },
];

// Define the Columns for the Review Table.
// Takes: A record of the Classifications and handlers for updating the selected Classification for a specific Row.
// Returns: The definition for the Columns to display in the review Table.
export const reviewColumns = (
  selectedCategories: Record<string, string>,
  selectedTaxCodes: Record<string, string>,
  handleCategoryChange: (transaction_Id: string, category: string) => void,
  handleTaxCodeChange: (transaction_Id: string, taxCode: string) => void
): ColumnDef<ClassifiedForReviewTransaction>[] => [
  // Define the order of the Columns. Start with the select, date, type, payee, and account Columns.
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
      const categories: Classification[] = row.getValue('categories');
      return categories.length > 0 ? (
        <select
          className="rounded-lg border border-gray-700 px-2 py-1"
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
  },

  // Define the Tax Codes Column.
  {
    accessorKey: 'taxCodes',
    header: 'Tax Codes',
    cell: ({ row }: { row: Row<ClassifiedForReviewTransaction> }) => {
      const taxCodes: Classification[] = row.getValue('taxCodes');
      return taxCodes.length > 0 ? (
        <select
          className="rounded-lg border border-gray-700 px-2 py-1"
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
  },

  // Define the Category Confidence Column
  {
    accessorKey: 'categoryConfidence',
    header: 'Category Confidence',
    cell: ({ row }: { row: Row<ClassifiedForReviewTransaction> }) => {
      // Set the inital Confidence Value and define the values for each Classification method.
      let categoryConfidenceValue = 0;
      const LLMClassified = 1;
      const DatabaseClassified = 2;
      const FuseClassified = 3;

      const categories: ClassifiedElement[] = row.getValue('categories');

      // Determine the highest Confidence Value present from how the Categories were predicted.
      if (categories.length > 0) {
        // If any Category is found, the lowest possible Confidence Value is 1/3 (LLM).
        categoryConfidenceValue = LLMClassified;
        // Iterate through the Categories to determine the Confidence Value.
        for (const category of categories) {
          // For database predictions, update minimum Confidence Value to 2/3.
          if (category.classifiedBy === 'Database') {
            categoryConfidenceValue = DatabaseClassified;
          }
          // If the Category is Classified by matching, update the Confidence Value to 3/3.
          if (category.classifiedBy === 'Matching') {
            // Break the loop as no higher value is possible.
            categoryConfidenceValue = FuseClassified;
            break;
          }
        }
      }

      // Determine the text to display on a hover card on top of the Confidence Bar.
      let hoverText = '';
      if (categoryConfidenceValue === 0) {
        hoverText = 'No Classification results found.';
      }
      if (categoryConfidenceValue === LLMClassified) {
        hoverText = 'Results found by LLM prediction.';
      }
      if (categoryConfidenceValue === DatabaseClassified) {
        hoverText = 'Results found by database check.';
      }
      if (categoryConfidenceValue === FuseClassified) {
        hoverText = 'Results found by name matching.';
      }
      // Create and return a Confidence Bar using the defined Confidence Value and hover text.
      return (
        <ConfidenceBar
          confidence={categoryConfidenceValue}
          hoverText={hoverText}
        />
      );
    },
  },

  // Define the Tax Code Confidence Column
  {
    accessorKey: 'taxCodeConfidence',
    header: 'Confidence',
    cell: ({ row }: { row: Row<ClassifiedForReviewTransaction> }) => {
      // Set the inital Confidence Value and define the values for each Classification method.
      let confidenceValue = 0;
      const LLMClassified = 1;
      const DatabaseClassified = 2;
      const FuseClassified = 3;

      const taxCodes: ClassifiedElement[] = row.getValue('taxCodes');

      // Determine the highest Confidence Value present from how the Tax Codes were predicted.
      if (taxCodes.length > 0) {
        // If any Tax Code is found, the lowest possible Confidence Value is 1/3 (LLM).
        confidenceValue = LLMClassified;
        // Iterate through the Tax Codes to determine the Confidence Value.
        for (const taxCode of taxCodes) {
          // For database predictions, update minimum Confidence Value to 2/3.
          if (taxCode.classifiedBy === 'Database') {
            confidenceValue = DatabaseClassified;
          }
          // If the Tax Code is Classified by matching, update the Confidence Value to 3/3.
          if (taxCode.classifiedBy === 'Matching') {
            // Break the loop as no higher value is possible.
            confidenceValue = FuseClassified;
            break;
          }
        }
      }

      // Determine the text to display on a hover card on top of the Confidence Bar.
      let hoverText = '';
      if (confidenceValue === 0) {
        hoverText = 'No Classification results found.';
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

      // Create and return a Confidence Bar using the defined Confidence Value and hover text.
      return (
        <ConfidenceBar confidence={confidenceValue} hoverText={hoverText} />
      );
    },
  },
];
