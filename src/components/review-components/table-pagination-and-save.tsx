'use client';

import type { Table } from '@tanstack/react-table';

import type {
  ForReviewTransaction,
  ClassifiedForReviewTransaction,
} from '@/types/index';

import { Button } from '@/components/ui/button';

export function TablePaginationAndSave({
  table,
  rowSelection,
  categorizedTransactions,
  isSaving,
  handleSave,
}: Readonly<{
  table: Table<ClassifiedForReviewTransaction>;
  rowSelection: Record<number, boolean>;
  categorizedTransactions: (
    | ForReviewTransaction
    | ClassifiedForReviewTransaction
  )[][];
  isSaving: boolean;
  handleSave: (
    selectedRows: Record<number, boolean>,
    transactions: (ClassifiedForReviewTransaction | ForReviewTransaction)[][]
  ) => void;
}>) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="ml-2 mr-2 mt-0.5 p-2 text-center text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length} of{' '}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>

      <div className="grid grid-rows-2 space-y-1 sm:grid-cols-2 sm:grid-rows-1 sm:space-x-2 sm:space-y-0">
        <div>
          <Button
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
          onClick={() => handleSave(rowSelection, categorizedTransactions)}
          disabled={
            isSaving || table.getFilteredSelectedRowModel().rows.length === 0
          }
          className="ml-2 mr-4 h-12 w-24 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600">
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
