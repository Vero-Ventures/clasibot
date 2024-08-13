import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import type { HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react';

// Define the table component and its display name.
const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    // Define the table component with class names and props.
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  )
);

Table.displayName = 'Table';

// Define the table header and its display name.
const TableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  // Define the table header component with class names and props.
  <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
));

TableHeader.displayName = 'TableHeader';

// Define the table body and its display name.
const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  // Define the table body component with class names and props.
  <tbody ref={ref} className={cn('', className)} {...props} />
));

TableBody.displayName = 'TableBody';

// Define the table footer and its display name.
const TableFooter = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  // Define the table footer component with class names and props.
  <tfoot
    ref={ref}
    className={cn(
      'border-t bg-slate-100/50 font-medium [&>tr]:last:border-b-0 dark:bg-slate-800/50',
      className
    )}
    {...props}
  />
));

TableFooter.displayName = 'TableFooter';

// Define the table row and its display name.
const TableRow = forwardRef<
  HTMLTableRowElement,
  HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  // Define the table row component with class names and props.
  <tr
    ref={ref}
    className={cn(
      'border-2 border-gray-300 transition-colors hover:bg-slate-100/50 data-[state=selected]:bg-slate-100 dark:hover:bg-slate-800/50 dark:data-[state=selected]:bg-slate-800',
      className
    )}
    {...props}
  />
));

TableRow.displayName = 'TableRow';

// Define the table head and its display name.
const TableHead = React.forwardRef<
  HTMLTableCellElement,
  ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  // Define the table head component with class names and props.
  <th
    ref={ref}
    className={cn(
      'text-left align-middle font-medium text-slate-500 h-12 px-4 [&:has([role=checkbox])]:pr-0 dark:text-slate-400',
      className
    )}
    {...props}
  />
));

TableHead.displayName = 'TableHead';

// Define the table cell and its display name.
const TableCell = React.forwardRef<
  HTMLTableCellElement,
  TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  // Define the table cell component with class names and props.
  <td
    ref={ref}
    className={cn('align-middle p-4 [&:has([role=checkbox])]:pr-0', className)}
    {...props}
  />
));

TableCell.displayName = 'TableCell';

// Define the table caption and its display name.
const TableCaption = forwardRef<
  HTMLTableCaptionElement,
  HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  // Define the table caption component with class names and props.
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-slate-500 dark:text-slate-400', className)}
    {...props}
  />
));

TableCaption.displayName = 'TableCaption';

// Export the table and table components.
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
