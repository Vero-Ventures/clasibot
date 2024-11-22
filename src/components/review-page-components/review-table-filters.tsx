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
      <div className="mt-6 flex flex-grow px-6">
        <Input
          placeholder="Search by transaction description..."
          // Set the input value to the name filter value from the table (or an empty string).
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          // When the input value changes, update the name filter value with the new value.
          onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
          }
          className="mx-auto max-w-xs focus:ring focus:!ring-blue-500 mb:max-w-sm sm:max-w-full md:w-2/3 lg:max-w-2xl"
        />
      </div>
      <div className="mb-4 mt-2 flex w-full flex-col md:mt-6 md:flex-row">
        <div className="mx-auto flex w-11/12 flex-col items-center md:w-1/2 md:justify-evenly md:px-6">
          <div className="mb-1 mt-4 flex w-full flex-row justify-evenly md:mt-0">
            <p className="w-full min-w-[174px] max-w-56 px-4 text-center font-semibold md:min-w-[182px]">
              Start Date
            </p>
            <p className="w-full min-w-[174px] max-w-56 px-4 text-center font-semibold md:min-w-[182px]">
              End Date
            </p>
          </div>
          <div className="flex w-full flex-row justify-evenly md:mt-0">
            <DatePicker date={startDate} setDate={changeStartDate} />
            <DatePicker date={endDate} setDate={changeEndDate} />
          </div>
        </div>
        <div className="mx-auto mt-6 flex w-11/12 items-center justify-evenly md:mt-6 md:w-1/2">
          <div className="w-full max-w-64 px-4 md:max-w-48">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full border-2 border-gray-300 bg-white text-base font-semibold transition-all duration-300 ease-in-out hover:scale-105 hover:border-blue-100 hover:bg-blue-300 hover:ring">
                  Columns <ChevronDown className="ml-2 mt-1 h-6 w-6" />
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
          <div className="w-full max-w-64 px-4 md:max-w-48">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full border-2 border-gray-300 bg-white text-base font-semibold transition-all duration-300 ease-in-out hover:scale-105 hover:border-blue-100 hover:bg-blue-300 hover:ring">
                  Accounts <ChevronDown className="ml-2 mt-1 h-6 w-6" />
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
        </div>
      </div>
    </div>
  );
}
