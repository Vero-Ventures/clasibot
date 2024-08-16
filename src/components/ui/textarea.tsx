import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import type { TextareaHTMLAttributes } from 'react';

// Export the text area props interface from the text area component.
export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

// Define the text area component and its display name.
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      // Define the text area component with class names, props, and a ref value.
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

// Export the text area component.
export { Textarea };
