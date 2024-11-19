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
    <div>
      <div className="mt-6 grid w-full grid-rows-2 md:grid-cols-2 md:grid-rows-1">
        <Input
          placeholder="Filter by name..."
          // Set the input value to the name filter value from the table (or an empty string).
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          // When the input value changes, update the name filter value with the new value.
          onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
          }
          className="mr-2 w-2/3 max-w-xs popout:mr-4 popout:w-1/2 md:mr-6 md:w-2/3"
        />
        <div className="mx-auto flex w-11/12 items-center md:w-5/6">
          <div className="mt-2 grid w-full grid-cols-2 gap-x-6 px-2 mb:gap-x-12 sm:gap-x-16 md:mt-0 md:gap-x-6">
            <DatePicker date={startDate} setDate={changeStartDate} />
            <DatePicker date={endDate} setDate={changeEndDate} />
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 grid grid-cols-2 gap-x-4 px-4 popout:gap-x-6 md:gap-x-12 md:px-6 lg:gap-x-20 lg:px-8 xl:gap-x-24 xl:px-10">
        <div className="ml-2 max-w-48 popout:ml-4 popout:w-1/4 md:ml-6 md:w-1/3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full bg-blue-500 text-white hover:bg-blue-800 hover:text-white">
                Accounts <ChevronDown className="ml-2 mt-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              {/* For each Account, create a checkbox item in the dropdown menu. */}
              {accountNames.map((account) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={account}
                    className="capitalize focus:bg-blue-300"
                    checked={selectedAccounts.includes(account)}
                    onCheckedChange={() => updateAccountSelection(account)}>
                    {account}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="bg-blue-500 text-white hover:bg-blue-800 hover:text-white">
              Columns <ChevronDown className="ml-2 mt-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            {/* Gets a list of the Columns and filters out the ones that cannot be hidden. */}
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                const field = column.id;
                return (
                  // Create a checkbox item for each Column that can be hidden.
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize focus:bg-blue-300"
                    // Checked status is determined by the associated Column's visibility state.
                    checked={column.getIsVisible()}
                    // On change, toggle the visibility of the associated Column.
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }>
                    {field}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
