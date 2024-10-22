import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Takes: A nullable Date object and a setDate function.
export function DatePicker({
  date,
  setDate,
}: Readonly<{
  date: Date | null;
  setDate: (date: Date | null) => void;
}>) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {/* Date picker input containing a calendar icon. */}
        <Button
          id="DatePickerButton"
          variant={'outline'}
          className={cn(
            'w-full justify-center border-2 border-gray-300 pr-4 text-center font-normal mb:pr-6',
            !date && 'text-muted-foreground'
          )}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {/* Either displays a date, or a message indicating to pick one. */}
          {/* If date is not null, format the date as MM/dd/yyyy (Capitalization is needed). Otherwise, display the message. */}
          {date !== null && format(date, 'MM/dd/yyyy')}
          {date === null && <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        {/* Date starts unselected. When selected, the setDate function is called. */}
        <Calendar
          id="DatePickerDropdownCalendar"
          mode="single"
          selected={date || undefined}
          onSelect={(day: Date | null) => setDate(day ?? null)}
          className="bg-white"
          required
        />
      </PopoverContent>
    </Popover>
  );
}
