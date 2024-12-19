'use client';

import { useEffect, useState } from 'react';

import type { Table } from '@tanstack/react-table';

import { checkForUndoTransactions } from '@/actions/db-review-transactions/index';

import type {
  ClassifiedForReviewTransaction,
  RawForReviewTransaction,
} from '@/types/index';

import {
  Button,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/index';
import { undoForReviewSave } from '@/actions/quickbooks/for-review/undo-for-review';

// Takes: The Table component, the selected rows, the Classified Transactions,
//        If saving is in progess and the handler function for saving.
export function ReviewTablePagesAndSave({
  table,
  pageSize,
  rowSelection,
  classifiedTransactions,
  isSaving,
  handleSave,
}: Readonly<{
  table: Table<ClassifiedForReviewTransaction>;
  pageSize: number;
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
  // Define state to track if there are recently saved 'For Review' transactions to undo.
  const [enableUndo, setEnableUndo] = useState<boolean>(false);

  // On element load, check if there are 'For Review' transactions to undo.
  useEffect(() => {
    const checkForUndo = async () => {
      setEnableUndo(await checkForUndoTransactions());
    };
    checkForUndo();
  }, []);

  return (
    <div className="flex flex-col items-center justify-between pt-2 md:flex-row xl:px-12">
      <div className="mb-6 flex h-12 w-full flex-row items-center px-2 mb:px-4 md:mb-0 md:w-1/2">
        <div className="mr-2 mt-1 h-fit min-w-[75px] py-2 text-center text-sm text-muted-foreground mb:mr-4 mb:min-w-[90px] md:mr-0 md:w-1/5 md:min-w-[110px] lg:w-1/6">
          {table.getState().pagination.pageIndex < 0
            ? 0
            : table.getState().pagination.pageIndex * pageSize}{' '}
          - {(table.getState().pagination.pageIndex + 1) * pageSize} of{' '}
          {table.getFilteredRowModel().rows.length}
        </div>
        <div className="sm:max-w-1/2 flex h-fit flex-grow flex-row justify-evenly gap-x-4">
          <HoverCard openDelay={150} closeDelay={150}>
            <HoverCardContent>
              {'View Previous 10 Transactions'}
            </HoverCardContent>
            <HoverCardTrigger asChild>
              <Button
                className="w-full min-w-20 max-w-36 rounded-md border-2 border-gray-300 bg-white p-2 py-2 text-base font-semibold text-black shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:border-blue-100 hover:bg-blue-300 hover:ring md:h-11 md:max-w-32 md:text-lg lg:max-w-48"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}>
                Previous
              </Button>
            </HoverCardTrigger>
          </HoverCard>

          <HoverCard openDelay={150} closeDelay={150}>
            <HoverCardContent>{'View Next 10 Transactions'}</HoverCardContent>
            <HoverCardTrigger asChild>
              <Button
                className="w-full min-w-20 max-w-36 rounded-md border-2 border-gray-300 bg-white p-2 py-2 font-sans text-base font-semibold text-black shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:border-blue-100 hover:bg-blue-300 hover:ring md:h-11 md:max-w-32 md:text-lg lg:max-w-48"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}>
                Next
              </Button>
            </HoverCardTrigger>
          </HoverCard>
        </div>
      </div>

      <div className="flex w-full justify-evenly md:w-1/2">
        <Button
          onClick={() => undoForReviewSave()}
          disabled={!enableUndo}
          className="h-12 w-1/3 rounded-md border-2 border-gray-300 bg-white p-2 py-2 font-sans text-base font-semibold text-black shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:border-blue-100 hover:bg-blue-300 hover:ring md:min-w-32 md:max-w-52">
          Undo Save
        </Button>
        <Button
          onClick={() => handleSave(rowSelection, classifiedTransactions)}
          disabled={
            isSaving || table.getFilteredSelectedRowModel().rows.length === 0
          }
          className="h-12 w-1/3 rounded bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-lg font-bold text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 sm:min-w-32 sm:max-w-52">
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
