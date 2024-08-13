'use client';
import { forwardRef } from 'react';
import {
  Provider,
  Viewport,
  Root,
  Action,
  Close,
  Title,
  Description,
} from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ElementRef, ComponentPropsWithoutRef, ReactElement } from 'react';

// Define the toast provider and its display name.
const ToastProvider = Provider;

// Define the toast viewport and its display name.
const ToastViewport = forwardRef<
  ElementRef<typeof Viewport>,
  ComponentPropsWithoutRef<typeof Viewport>
>(({ className, ...props }, ref) => (
  // Define the toast viewport component with class names, props, and a ref value.
  <Viewport
    ref={ref}
    className={cn(
      'fixed top-0 z-[100001] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
      className
    )}
    {...props}
  />
));

ToastViewport.displayName = Viewport.displayName;

// Define the toast variants: default & destructive.
const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border border-slate-200 p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full dark:border-slate-800',
  {
    variants: {
      variant: {
        default:
          'border bg-white text-slate-950 dark:bg-slate-950 dark:text-slate-50',
        destructive:
          'destructive group border-red-500 bg-red-500 text-slate-50 dark:border-red-900 dark:bg-red-900 dark:text-slate-50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Define the toast component and its display name.
const Toast = forwardRef<
  ElementRef<typeof Root>,
  ComponentPropsWithoutRef<typeof Root> & VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  // Define the toast component with class names, props, and a ref value.
  return (
    <Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
});

Toast.displayName = Root.displayName;

// Define the toast action and its display name.
const ToastAction = forwardRef<
  ElementRef<typeof Action>,
  ComponentPropsWithoutRef<typeof Action>
>(({ className, ...props }, ref) => (
  // Define the toast action component with class names and props.
  <Action
    ref={ref}
    className={cn(
      'inline-flex shrink-0 items-center justify-center bg-transparent border border-slate-200 rounded-md ring-offset-white text-sm font-medium h-8 px-3 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-slate-100/40 group-[.destructive]:hover:border-red-500/30 group-[.destructive]:hover:bg-red-500 group-[.destructive]:hover:text-slate-50 group-[.destructive]:focus:ring-red-500 dark:border-slate-800 dark:ring-offset-slate-950 dark:hover:bg-slate-800 dark:focus:ring-slate-300 dark:group-[.destructive]:border-slate-800/40 dark:group-[.destructive]:hover:border-red-900/30 dark:group-[.destructive]:hover:bg-red-900 dark:group-[.destructive]:hover:text-slate-50 dark:group-[.destructive]:focus:ring-red-900',
      className
    )}
    {...props}
  />
));

ToastAction.displayName = Action.displayName;

const ToastClose = forwardRef<
  ElementRef<typeof Close>,
  ComponentPropsWithoutRef<typeof Close>
>(({ className, ...props }, ref) => (
  // Define the toast close component with class names and props.
  <Close
    ref={ref}
    className={cn(
      'absolute right-2 top-2 rounded-md text-slate-950/50 p-1 opacity-0 transition-opacity hover:text-slate-950 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600 dark:text-slate-50/50 dark:hover:text-slate-50',
      className
    )}
    toast-close=""
    {...props}>
    <X className="h-4 w-4" />
  </Close>
));

ToastClose.displayName = Close.displayName;

// Define the toast title and its display name.
const ToastTitle = forwardRef<
  ElementRef<typeof Title>,
  ComponentPropsWithoutRef<typeof Title>
>(({ className, ...props }, ref) => (
  // Define the toast title component with class names and props.
  <Title
    ref={ref}
    className={cn('text-sm font-semibold', className)}
    {...props}
  />
));

ToastTitle.displayName = Title.displayName;

// Define the toast description and its display name.
const ToastDescription = forwardRef<
  ElementRef<typeof Description>,
  ComponentPropsWithoutRef<typeof Description>
>(({ className, ...props }, ref) => (
  // Define the toast description component with class names and props.
  <Description
    ref={ref}
    className={cn('text-sm opacity-90', className)}
    {...props}
  />
));

ToastDescription.displayName = Description.displayName;

// Define the toast props type.
type ToastProps = ComponentPropsWithoutRef<typeof Toast>;

// Define the toast action element type.
type ToastActionElement = ReactElement<typeof ToastAction>;

// Export the toast types and comonents.
export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
