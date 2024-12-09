'use client';

import { flexRender } from '@tanstack/react-table';
import type { Table } from '@tanstack/react-table';

import {
  Table as DisplayTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { ClassifiedForReviewTransaction } from '@/types/index';

export function ReviewTableDisplay({
  table,
  loadingTransactions,
}: Readonly<{
  table: Table<ClassifiedForReviewTransaction>;
  loadingTransactions: boolean;
}>) {
  return (
    <div className="tableMin:w-[280px] tableName:w-[426px] tableAmount:w-[550px] tableCatagories:w-[666px] tableCatConfidence:w-[890px] tableTaxCodes:w-[970px] tableTaxConfidence:min-w-full mb-1 mt-4 overflow-x-auto rounded-md border-4 border-gray-400 bg-white shadow-lg md:mb-2">
      <DisplayTable>
        {/* Table Header */}
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="divide-x-2 divide-gray-300 !border-b-2 bg-gray-100">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={`bg-white py-3 text-left font-semibold text-gray-800 ${header.column.getCanSort() ? '!py-2 !pl-1 !pr-2' : ''} `}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        {/* Table Body */}
        <TableBody className="divide-y-8 divide-gray-200">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={`divide-x-2 divide-gray-300 transition-colors ${
                  row.getIsSelected() ? 'bg-blue-100' : ''
                } hover:bg-blue-100`}
                onClick={() => row.toggleSelected(!row.getIsSelected())}
                style={{ cursor: 'pointer' }}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="px-4 py-3 text-sm font-semibold text-gray-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                className="py-8"></TableCell>
              {loadingTransactions ? (
                <div className="absolute inset-1/2 text-xl font-semibold text-black">
                  <p className="mt-5 w-40 -translate-x-20">Loading ...</p>
                </div>
              ) : (
                <div className="absolute inset-1/2 text-xl font-semibold text-red-400">
                  <p className="mt-5 w-40 -translate-x-20">No Results Found</p>
                </div>
              )}
            </TableRow>
          )}
        </TableBody>
      </DisplayTable>
    </div>
  );
}
