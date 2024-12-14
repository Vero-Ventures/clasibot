'use client';

import type { Table } from '@tanstack/react-table';

import { ChevronDown } from 'lucide-react';

import { DatePicker } from '@/components/inputs/index';

import type { ClassifiedForReviewTransaction } from '@/types/index';

import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Input,
} from '@/components/ui/index';

// Takes: The Table component, the start date and end date for filtering and their setters,
//        A list of Account names as strings, the list of selected Accounts, and the setter to update it.
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
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
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
          <div className="flex w-full flex-row justify-evenly">
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
                  className="w-full border-2 border-gray-300 bg-white font-semibold transition-all duration-300 ease-in-out hover:scale-105 hover:border-blue-100 hover:bg-blue-300 hover:ring">
                  Columns <ChevronDown className="ml-2 mt-1 h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    let field = column.id;
                    if (field === 'taxCodes') {
                      field = 'Tax Codes';
                    }
                    if (field === 'categoryConfidence') {
                      field = 'Category Confidence';
                    }
                    if (field === 'taxCodeConfidence') {
                      field = 'Tax Code Confidence';
                    }
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="w-[130px] capitalize focus:bg-blue-300"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value: boolean) =>
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
                  disabled={accountNames.length === 0}
                  variant="outline"
                  className="w-full border-2 border-gray-300 bg-white font-semibold transition-all duration-300 ease-in-out hover:scale-105 hover:border-blue-100 hover:bg-blue-300 hover:ring">
                  Accounts <ChevronDown className="ml-2 mt-1 h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                {accountNames.map((account) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={account}
                      className="w-[130px] capitalize focus:bg-blue-300"
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
