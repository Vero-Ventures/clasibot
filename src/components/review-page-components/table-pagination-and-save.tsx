'use client';

import type { Table } from '@tanstack/react-table';

import type {
  RawForReviewTransaction,
  ClassifiedForReviewTransaction,
} from '@/types/index';

import { Button } from '@/components/ui/index';

// Takes: The table component, the selected rows, the Classified Transactions,
//        If saving is in progess and the handler function for saving.
export function TablePaginationAndSave({
  table,
  rowSelection,
  classifiedTransactions,
  isSaving,
  handleSave,
}: Readonly<{
  table: Table<ClassifiedForReviewTransaction>;
  rowSelection: Record<number, boolean>;
  classifiedTransactions: (
    | ClassifiedForReviewTransaction
    | RawForReviewTransaction
  )[][];
  isSaving: boolean;
  handleSave: (
    selectedRows: Record<number, boolean>,
    transactions: (ClassifiedForReviewTransaction | RawForReviewTransaction)[][]
  ) => void;
}>) {
  return (
    <div className="flex flex-col items-center justify-between pt-2 sm:flex-row xl:px-12">
      <div className="mb-6 flex h-12 w-full flex-row items-center px-2 mb:px-4 sm:mb-0">
        <div className="mr-2 mt-1 h-fit min-w-[75px] py-2 text-center text-sm text-muted-foreground mb:mr-4 mb:min-w-[90px] sm:mr-0 sm:w-1/5 sm:min-w-[110px] sm:pr-6 lg:w-1/6">
          {table.getState().pagination.pageIndex < 0
            ? 0
            : table.getState().pagination.pageIndex * 10}{' '}
          - {table.getState().pagination.pageIndex * 10 + 10} of{' '}
          {table.getFilteredRowModel().rows.length}
        </div>
        <div className="sm:max-w-1/2 flex h-fit flex-grow flex-row justify-evenly gap-x-4">
          <Button
            className="w-full min-w-20 max-w-36 rounded-md border-2 border-gray-300 bg-white p-2 py-2 text-base font-semibold text-black shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:border-blue-100 hover:bg-blue-300 hover:ring md:h-11 md:max-w-40 md:text-lg lg:max-w-48"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>

          <Button
            className="w-full min-w-20 max-w-36 rounded-md border-2 border-gray-300 bg-white p-2 py-2 font-sans text-base font-semibold text-black shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:border-blue-100 hover:bg-blue-300 hover:ring md:h-11 md:max-w-40 md:text-lg lg:max-w-48"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>

      <div className="flex w-full justify-center sm:mr-4 sm:w-1/4 md:mr-8">
        <Button
          onClick={() => handleSave(rowSelection, classifiedTransactions)}
          disabled={
            isSaving || table.getFilteredSelectedRowModel().rows.length === 0
          }
          className="h-12 w-1/2 rounded bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-lg font-bold text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 sm:w-full sm:min-w-32 sm:max-w-52 xl:mr-4">
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
