import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

// Takes a date and a setDate function as arguments.
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
        {/* Date picker button containing a calendar icon. */}
        <Button
          id="DatePickerButton"
          variant={'outline'}
          className={cn(
            'w-[280px] justify-center text-center font-normal w-full pr-4 mb:pr-6 border-2 border-gray-300',
            !date && 'text-muted-foreground'
          )}>
          <CalendarIcon className="h-4 w-4 mr-2" />
          {/* Button text either says a date, or a message indicating to pick a date. */}
          {/* If date is not null, format the date as MM/dd/yyyy. Otherwise, display the message. */}
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
          onSelect={day => setDate(day ?? null)}
          initialFocus
          className="bg-white"
        />
      </PopoverContent>
    </Popover>
  );
}
