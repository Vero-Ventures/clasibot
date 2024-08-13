'use client';
import { forwardRef } from 'react';
import { Root, Trigger, Content, Portal } from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';
import type { ElementRef, ComponentPropsWithoutRef } from 'react';

// Define the popover component.
const Popover = Root;

// Define the popover trigger component.
const PopoverTrigger = Trigger;

// Define the popover content component and its display name.
const PopoverContent = forwardRef<
  ElementRef<typeof Content>,
  ComponentPropsWithoutRef<typeof Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
  // Define the popover content component with class names, align (default = center), side offset (default = 4), props, and a ref value.
  <Portal>
    <Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'bg-white-0 border border-slate-200 rounded-md shadow-md outline-non text-slate-95 z-50 w-72 p-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50',
        className
      )}
      {...props}
    />
  </Portal>
));

PopoverContent.displayName = Content.displayName;

// Export the popover, popover trigger, and popover content components.
export { Popover, PopoverTrigger, PopoverContent };
