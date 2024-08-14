'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { contactAction } from '@/actions/contact';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ToastAction } from '@/components/ui/toasts/toast';
import { useToast } from '@/components/ui/toasts/use-toast';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Define the contact form via Zod schema.
const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  subject: z.string().min(1, { message: 'Subject is required' }),
  body: z.string().min(1, { message: 'Message body is required' }),
});

export default function Page() {
  // Create state to track loading status of form submission.
  const [loading, setLoading] = useState(false);

  // Using the defined schema, create a blank react-hook-form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      subject: '',
      body: '',
    },
  });

  // Create a toast hook to display messages to the user.
  const { toast } = useToast();
  // Create a toast object with the error title and description.
  // Includes an action button to retry the form submission (resend the email).
  const toastError = (values: z.infer<typeof formSchema>) => {
    toast({
      variant: 'destructive',
      title: 'Uh oh! Something went wrong.',
      description: 'There was a problem with your request.',
      action: (
        <ToastAction
          id="RetryEmail"
          altText="Retry sending email"
          onClick={() => {
            handleSubmit(values);
          }}>
          Retry
        </ToastAction>
      ),
    });
  };

  // Define a function to handle form submission using the Zod schema.
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);

    const { email, subject, body } = values;

    try {
      // Call the contactAction function with the email, subject, and body.
      const response = await contactAction({ email, subject, body });

      if (response.message === 'error') {
        toastError(values);
      } else {
        toast({
          title: 'Email sent!',
          description: "We'll get back to you as soon as possible.",
        });

        // Reset the form after submission.
        form.reset();
      }
    } catch (error) {
      // If there is an error, log the error to the console and display an error toast.
      console.error(error);
      toastError(values);
    } finally {
      // After successful OR failed sending, the loading state to false.
      setLoading(false);
    }
  };

  return (
    <main id="ContactUsContainer" className="flex flex-col items-center justify-between p-12">
      <h1
        id="FormTitle"
        className="scroll-m-20 text-4xl font-extrabold tracking-tight md:text-5xl">
        Contact Us
      </h1>
      <Form {...form}>
        <form
          id="ContactForm"
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex w-full max-w-md flex-col gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your email address"
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject</FormLabel>
                <FormControl>
                  <Input placeholder="Subject" type="text" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Textarea placeholder="Your message" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-col justify-end gap-4 md:flex-row">
            <Link href="/" className="w-full md:w-auto">
              <Button
                id="ReturnHomeButton"
                className="w-full rounded-lg bg-gray-500 px-4 py-2 text-white shadow-md transition-colors duration-300 hover:bg-gray-600 md:w-auto">
                Go back to home
              </Button>
            </Link>
            <Button
              type="submit"
              id="SubmitButton"
              className={`${loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} w-full rounded-lg px-4 py-2 text-white shadow-md transition-colors duration-300 md:w-auto`}
              disabled={loading}>
              {loading ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </Form>
    </main>
  );
}
