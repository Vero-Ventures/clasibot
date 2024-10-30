import { createContext, forwardRef, useContext, useId, useMemo } from 'react';
import type { Root } from '@radix-ui/react-label';
import { Slot } from '@radix-ui/react-slot';
import type { ControllerProps, FieldPath, FieldValues } from 'react-hook-form';
import { Controller, FormProvider, useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import type {
  ElementRef,
  HTMLAttributes,
  ComponentPropsWithoutRef,
} from 'react';

// Define the Form component
const Form = FormProvider;

// Define the FormFieldContextValue type
type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

// Define the FormFieldContext context element.
const FormFieldContext = createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

// Define the FormField component.
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider
      value={useMemo(() => ({ name: props.name }), [props.name])}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

// Define the use function for the form field.
const useFormField = () => {
  // Define the field context and item context.
  const fieldContext = useContext(FormFieldContext);
  const itemContext = useContext(FormItemContext);
  // Define a state to track and set the value of the field.
  const { getFieldState, formState } = useFormContext();
  // Define the field state using the field context name and form state.
  const fieldState = getFieldState(fieldContext.name, formState);
  if (!fieldContext) {
    // Throw an error if the field context is not defined.
    throw new Error('useFormField should be used within <FormField>');
  }
  // Define an Id for the field using the item context Id.
  const { id } = itemContext;
  // Return the field Id, name, form item Id, form description Id, form message Id, and field state.
  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

// Define the form item context value type.
type FormItemContextValue = {
  id: string;
};

// Define the form item context element.
const FormItemContext = createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

// Define the FormItem component and display name.
const FormItem = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    // Define the form item context Id using react.
    const id = useId();
    // Return the form item context provider with the Id and class name.
    return (
      <FormItemContext.Provider value={useMemo(() => ({ id }), [id])}>
        <div ref={ref} className={cn('space-y-2', className)} {...props} />
      </FormItemContext.Provider>
    );
  }
);

FormItem.displayName = 'FormItem';

// Define the form label component and display name.
const FormLabel = forwardRef<
  ElementRef<typeof Root>,
  ComponentPropsWithoutRef<typeof Root>
>(({ className, ...props }, ref) => {
  // Define the error and form item Id values using the form field.
  const { error, formItemId } = useFormField();
  // Return the label component with the class name, error, and form item Id.
  return (
    <Label
      ref={ref}
      className={cn(error && 'text-red-500 dark:text-red-900', className)}
      htmlFor={formItemId}
      {...props}
    />
  );
});

FormLabel.displayName = 'FormLabel';

// Define the form control component and display name.
const FormControl = forwardRef<
  ElementRef<typeof Slot>,
  ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  // Get the error, form item Id, form description Id, and form message Id using the form field.
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();
  // Return the slot component with the values defined by the passed and values found from the form field.
  let ariaDescribedByValue;
  if (!error) {
    ariaDescribedByValue = `${formDescriptionId}`;
  } else {
    ariaDescribedByValue = `${formDescriptionId} ${formMessageId}`;
  }
  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={ariaDescribedByValue}
      aria-invalid={!!error}
      {...props}
    />
  );
});

FormControl.displayName = 'FormControl';

// Define the form description component and display name.
const FormDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  // Get the form description Id using the form field.
  const { formDescriptionId } = useFormField();
  // Return the paragraph element with the class name and form description Id.
  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn('text-sm text-slate-500 dark:text-slate-400', className)}
      {...props}
    />
  );
});

FormDescription.displayName = 'FormDescription';

// Define the form message component and display name.
const FormMessage = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  // Get the error and form message Id using the form field.
  const { error, formMessageId } = useFormField();
  // Define the body using the error and children values.
  let body;
  if (error) {
    body = error?.message;
  } else {
    body = children;
  }
  // If the body is not defined, return null.
  if (!body) {
    return null;
  }
  // Return the paragraph element with the reference, form message Id, class name, and body.
  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn(
        'text-sm font-medium text-red-500 dark:text-red-900',
        className
      )}
      {...props}>
      {body}
    </p>
  );
});

FormMessage.displayName = 'FormMessage';

// Export the form field functions and form item components.
export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
