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
    <div className="flex min-h-full items-center justify-center bg-gray-100 px-4 py-6">
      <section
        id="contact-us"
        className="w-full max-w-2xl transform overflow-auto rounded-lg bg-white px-8 py-10 shadow-lg transition-transform duration-500 hover:scale-105 hover:shadow-2xl"
        style={{ maxHeight: '90vh' }}>
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
                    <Textarea placeholder="Your message" rows={5} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div
              id="FormButtonsContainer"
              className="flex flex-col justify-end gap-4 sm:flex-row">
              <Link href="/" className="w-full sm:w-auto">
                <Button
                  id="ReturnHomeButton"
                  className="w-full rounded-lg bg-gray-500 px-6 py-3 text-white shadow-md transition-colors duration-300 hover:bg-gray-600 sm:w-auto">
                  Return to Home
                </Button>
              </Link>
              <Button
                type="submit"
                id="SubmitButton"
                className={`${
                  loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
                } w-full rounded-lg px-6 py-3 text-white shadow-md transition-colors duration-300 sm:w-auto`}
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
