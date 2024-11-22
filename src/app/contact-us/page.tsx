'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

import Link from 'next/link';

import { sendContactEmail } from '@/actions/contact';

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

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Define the 'contact us' form via Zod schema.
const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  subject: z.string().min(1, { message: 'Subject is required' }),
  body: z.string().min(1, { message: 'Message body is required' }),
});

// Define the 'Contact Us' page and its behavior.
export default function Page() {
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      subject: '',
      body: '',
    },
  });
  const { toast } = useToast();

  const toastError = (values: z.infer<typeof formSchema>) => {
    toast({
      variant: 'destructive',
      title: 'Something went wrong.',
      description: 'There was a problem sending your message.',
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

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    const { email, subject, body } = values;

    try {
      const response = await sendContactEmail({ email, subject, body });

      if (response.message === 'error') {
        toastError(values);
      } else {
        toast({
          title: 'Email sent!',
          description: "We'll get back to you as soon as possible.",
        });
        form.reset();
      }
    } catch (error) {
      console.error('Error Sending Message:', error);
      toastError(values);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full w-full max-w-3xl items-center justify-center bg-gray-100 px-8 py-10 sm:w-3/4">
      <section
        className="flex-grow transform overflow-auto rounded-lg bg-white px-8 py-10 shadow-lg transition-transform duration-500 hover:scale-105 hover:shadow-2xl"
        style={{ maxHeight: '90vh', width: '40vw', maxWidth: 'none' }}>
        <h1 className="mb-6 text-center text-4xl font-extrabold tracking-tight text-gray-800">
          Contact Us
        </h1>
        <Form {...form}>
          <form
            id="ContactForm"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <span className="text-base font-semibold sm:text-lg">
                      Email
                    </span>
                  </FormLabel>
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
                  <FormLabel>
                    <span className="text-base font-semibold sm:text-lg">
                      Subject
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your reason for contact"
                      type="text"
                      {...field}
                    />
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
                  <FormLabel>
                    <span className="text-base font-semibold sm:text-lg">
                      Details
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      className="max-h-64 min-h-36"
                      placeholder="Your message details"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="mb:w-/5 mx-auto flex w-3/4 flex-col justify-center gap-4 mb:min-w-64 sm:w-full sm:flex-row sm:justify-evenly">
              <Link href="/" className="sm:w-auto">
                <Button className="w-full rounded-lg bg-gray-500 px-6 py-3 text-base font-semibold text-white shadow-md transition-colors duration-300 hover:bg-gray-600 sm:w-40 sm:text-lg md:w-44 lg:w-56">
                  Return
                </Button>
              </Link>
              <Button
                type="submit"
                className={`${
                  loading
                    ? 'bg-gray-400'
                    : 'transform rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md transition-transform duration-300 ease-in-out hover:scale-105 hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75'
                } rounded-lg px-6 py-3 text-base font-semibold text-white shadow-md transition-colors duration-300 sm:w-40 sm:text-lg md:w-44 lg:w-56`}
                disabled={loading}>
                {loading ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </form>
        </Form>
      </section>
    </div>
  );
}
