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

import { ReviewColumns } from '@/components/review-page-components/index';

import type { ClassifiedForReviewTransaction } from '@/types/index';

export function ReviewTableDisplay({
  table,
}: Readonly<{
  table: Table<ClassifiedForReviewTransaction>;
}>) {
  return (
    <div className="mt-2 rounded border-2 border-gray-300">
      <DisplayTable>
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            // If the Table is empty (no Tows), display a message to indicate there are no results.
            <TableRow id="EmptyTable">
              <TableCell
                colSpan={ReviewColumns.length}
                className="relative pl-14 text-2xl font-bold mb:pl-0 mb:text-center">
                No results found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </DisplayTable>
    </div>
  );
}
