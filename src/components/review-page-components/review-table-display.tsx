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
}: Readonly<{
  table: Table<ClassifiedForReviewTransaction>;
}>) {
  return (
    <div className="mt-4 overflow-x-auto rounded-md border border-gray-300 bg-white shadow-md">
      <DisplayTable>
        {/* Table Header */}
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-gray-100">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-800">
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
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={`transition-colors ${
                  row.getIsSelected() ? 'bg-blue-100' : ''
                } hover:bg-blue-50`}
                onClick={() => row.toggleSelected(!row.getIsSelected())}
                style={{ cursor: 'pointer' }}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="px-4 py-3 text-sm text-gray-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                className="px-4 py-6 text-center text-sm font-medium text-gray-500">
                No results found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </DisplayTable>
    </div>
  );
}
