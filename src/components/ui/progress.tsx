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
      'relative bg-green-200 dark:bg-green-200 overflow-hidden rounded-full h-4 w-full',
      className
    )}
    {...props}>
    {/* Define the progress primitive indicator */}
    <Indicator
      className="flex-1 bg-green-400 h-full w-full transition-all"
      style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
    />
  </Root>
));

Progress.displayName = Root.displayName;

// Export the progress component.
export { Progress };
