'use client';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';

// Export the toaster function
export function Toaster() {
  // Use the toast hook to get the toasts.
  const { toasts } = useToast();
  return (
    <ToastProvider>
      {/* Map over the toasts to get ID, title, description, action, and remaining props. */}
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          // Create a toast component using the mapped values and the toast elements.
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
