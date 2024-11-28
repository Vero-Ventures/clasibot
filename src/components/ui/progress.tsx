'use client';
import { forwardRef } from 'react';
import { Root, Indicator } from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';
import type { ElementRef, ComponentPropsWithoutRef } from 'react';

const Progress = forwardRef<
  ElementRef<typeof Root>,
  ComponentPropsWithoutRef<typeof Root>
>(({ className, value, ...props }, ref) => (
  <Root
    ref={ref}
    className={cn(
      'relative h-4 w-full overflow-hidden rounded-full bg-green-200 dark:bg-green-200',
      className
    )}
    {...props}>
    <Indicator
      className="h-full w-full flex-1 bg-green-400 transition-all"
      style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
    />
  </Root>
));

Progress.displayName = Root.displayName;

export { Progress };
