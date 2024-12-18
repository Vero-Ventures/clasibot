'use client';
import { cn } from '@/lib/utils';
import { DayPicker } from 'react-day-picker';
import type { ComponentProps } from 'react';

export type CalendarProps = ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('calendarElement bg-white bg-opacity-100 p-3', className)}
      classNames={{
        months: 'flex flex-col p-2 calendarElement',
        month_grid: 'calendarElement',
        nav: 'flex w-full calendarElement',
        button_previous: 'absolute left-4 mt-0.5 calendarElement',
        button_next: 'absolute right-4 mt-0.5 calendarElement',
        month: 'px-2 calendarElement',
        caption_label:
          'text-md flex justify-center font-semibold mb-2 calendarElement',
        weekday: 'w-8 calendarElement',
        day: 'rounded-md border-4 border-white p-2 text-center transition-all duration-300 ease-in-out hover:scale-110 hover:bg-blue-300 calendarElement',
        selected:
          'scale-105 rounded-md border-4 border-white bg-blue-200 p-2 text-center font-bold transition-all duration-300 ease-in-out calendarElement',
        outside: 'pointer-events-none text-gray-400 calendarElement',
        ...classNames,
      }}
      {...props}
    />
  );
}

Calendar.displayName = 'Calendar';

export { Calendar };
