'use client';

import type { Table } from '@tanstack/react-table';

import { ChevronDown } from 'lucide-react';

import { DatePicker } from '@/components/inputs/index';

import type { ClassifiedForReviewTransaction } from '@/types/index';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ReviewTableFilters({
  startDate,
  endDate,
  accountNames,
  selectedAccounts,
  table,
  changeStartDate,
  changeEndDate,
  updateAccountSelection,
}: Readonly<{
  startDate: Date | null;
  endDate: Date | null;
  accountNames: string[];
  selectedAccounts: string[];
  table: Table<ClassifiedForReviewTransaction>;
  changeStartDate: (date: Date | null) => void;
  changeEndDate: (date: Date | null) => void;
  updateAccountSelection: (account: string) => void;
}>) {
  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex justify-center px-6">
        <Input
          placeholder="Search by transaction description..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
          }
          className="w-full max-w-lg rounded-md border border-gray-300 px-4 py-2 text-gray-700 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-300"
        />
      </div>

      {/* Filters Section */}
      <div className="flex flex-col gap-6 md:flex-row md:justify-center">
        {/* Date Filters */}
        <div className="flex flex-col items-center rounded-md border border-gray-200 bg-gray-50 p-4 shadow-md md:w-1/2">
          <p className="mb-2 text-sm font-medium text-gray-600">
            Filter by Date
          </p>
          <div className="flex w-full justify-around gap-4">
            <div className="flex flex-col items-center">
              <p className="text-sm font-semibold text-gray-800">Start Date</p>
              <DatePicker date={startDate} setDate={changeStartDate} />
            </div>
            <div className="flex flex-col items-center">
              <p className="text-sm font-semibold text-gray-800">End Date</p>
              <DatePicker date={endDate} setDate={changeEndDate} />
            </div>
          </div>
        </div>

        {/* Column and Account Filters */}
        <div className="flex flex-col items-center rounded-md border border-gray-200 bg-gray-50 p-4 shadow-md md:w-1/2">
          <p className="mb-4 text-sm font-medium text-gray-600">
            Filter by Options
          </p>
          <div className="flex w-full justify-around gap-4">
            {/* Columns Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-40 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 shadow-sm hover:bg-gray-100 focus:ring focus:ring-blue-300">
                  Columns <ChevronDown className="ml-2 h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="rounded-md shadow-lg">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize hover:bg-blue-100 focus:bg-blue-300"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }>
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Accounts Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-40 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 shadow-sm hover:bg-gray-100 focus:ring focus:ring-blue-300">
                  Accounts <ChevronDown className="ml-2 h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="rounded-md shadow-lg">
                {accountNames.map((account) => (
                  <DropdownMenuCheckboxItem
                    key={account}
                    className="capitalize hover:bg-blue-100 focus:bg-blue-300"
                    checked={selectedAccounts.includes(account)}
                    onCheckedChange={() => updateAccountSelection(account)}>
                    {account}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
