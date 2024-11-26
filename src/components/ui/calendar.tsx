'use client';
import { cn } from '@/lib/utils';
import { DayPicker } from 'react-day-picker';
import type { ComponentProps } from 'react';

// Export the Calendar component props.
export type CalendarProps = ComponentProps<typeof DayPicker>;

// Define the Calendar component which takes classnames, classnames -
// - a value determining whether show outside days (default true), and props.
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    // Return the DayPicker component with the showOutsideDays prop,
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      // Define the classnames for the DayPicker internal components.
      classNames={{
        months: 'flex flex-col p-2',
        nav: 'flex w-full',
        button_previous: 'absolute left-4',
        button_next: 'absolute right-4',
        month: 'px-2',
        caption_label: 'text-md flex justify-center font-semibold',
        weekday: 'w-8',
        day: 'rounded-md border-4 border-white p-2 text-center transition-all duration-300 ease-in-out hover:scale-110 hover:bg-blue-300',
        selected:
          'scale-105 rounded-md border-4 border-white bg-blue-200 p-2 text-center font-bold transition-all duration-300 ease-in-out',
        outside: 'pointer-events-none text-gray-400',
        ...classNames,
      }}
      // Add any additional passed props to the end of the DayPicker component.
      {...props}
    />
  );
}

// Define the display name of the Calendar component.
Calendar.displayName = 'Calendar';

// Export the Calendar component.
export { Calendar };
