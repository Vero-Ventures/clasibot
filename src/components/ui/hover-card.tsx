'use client';
import { forwardRef } from 'react';
import { Root, Trigger, Content } from '@radix-ui/react-hover-card';
import { cn } from '@/lib/utils';
import type { ElementRef, ComponentPropsWithoutRef } from 'react';

// Define the hover card component.
const HoverCard = Root;

// Define the hover card trigger component.
const HoverCardTrigger = Trigger;

// Define the hover card content component and its display name.
const HoverCardContent = forwardRef<
  ElementRef<typeof Content>,
  ComponentPropsWithoutRef<typeof Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
  // Define the hover card component with classnames, align (default = center), side offset (default = 4), props, and a ref value.
  <Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      'z-50 mt-1 w-[264px] rounded-md border border-slate-200 bg-white p-2 text-slate-950 shadow-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50',
      className
    )}
    {...props}
  />
));

HoverCardContent.displayName = Content.displayName;

// Export the hover card, hover card trigger, and hover card content components.
export { HoverCard, HoverCardTrigger, HoverCardContent };
