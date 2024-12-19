'use client';

import { cn } from '@/lib/utils';

import { Calendar as CalendarIcon } from 'lucide-react';

import { format } from 'date-fns';

import { Button, Calendar } from '@/components/ui/index';

// Takes: A nullable Date and a date setter callback function.
export function DatePicker({
  selectType,
  date,
  setDate,
  showCalendar,
}: Readonly<{
  selectType: string;
  date: Date | null;
  setDate: (date: Date | null) => void;
  showCalendar: boolean;
}>) {
  return (
    <div className="flex max-w-56 flex-grow px-4">
      <Button
        id={selectType + 'DateSelectorButton'}
        variant={'outline'}
        className={cn(
          'w-full justify-center border-2 border-gray-300 pr-6 text-center font-semibold transition-all duration-300 ease-in-out hover:border-blue-100 hover:bg-blue-300 hover:ring md:min-w-[150px]',
          !date && 'text-muted-foreground'
        )}>
        <CalendarIcon id="dateSelectorButton" className="mr-2 h-4 w-4" />
        {date !== null && format(date, 'MM/dd/yyyy')}
        {date === null && <span>Pick a date</span>}
      </Button>
      <Calendar
        id="DatePickerDropdownCalendar"
        mode="single"
        selected={date || undefined}
        onSelect={(day: Date | null) => setDate(day ?? null)}
        className={`absolute z-50 mt-12 items-center rounded-md border-3 border-blue-800 border-opacity-30 bg-white ${showCalendar ? '' : 'hidden'} ${selectType === 'start' ? 'mb:-translate-x-14 sm:-translate-x-24 md:-translate-x-8 lg:-translate-x-20' : '-translate-x-48 sm:-translate-x-24 md:-translate-x-20'}`}
        required
      />
    </div>
  );
}
