'use client';
import { forwardRef } from 'react';
import { Root, Indicator } from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';
import type { ElementRef, ComponentPropsWithoutRef } from 'react';

// Define the progress component and display name.
const Progress = forwardRef<
  ElementRef<typeof Root>,
  ComponentPropsWithoutRef<typeof Root>
>(({ className, value, ...props }, ref) => (
  // Define the progress root component with class names, value, props, and a ref value.
  <Root
    ref={ref}
    className={cn(
      'relative h-4 w-full overflow-hidden rounded-full bg-green-200 dark:bg-green-200',
      className
    )}
    {...props}>
    {/* Define the progress primitive indicator */}
    <Indicator
      className="h-full w-full flex-1 bg-green-400 transition-all"
      style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
    />
  </Root>
));

Progress.displayName = Root.displayName;

// Export the progress component.
export { Progress };
