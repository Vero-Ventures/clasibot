'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

// Define the contact form via Zod schema.
const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Subject is required' }),
});

export default function Page() {
  // Create state to track loading status of form submission.
  const [loading, setLoading] = useState(false);

  // Using the defined schema, create a blank react-hook-form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);

    const { email, password } = values;

    try {
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      id="SignInContainer"
      className="flex flex-col items-center justify-between p-12">
      <h1
        id="FormTitle"
        className="scroll-m-20 text-4xl font-extrabold tracking-tight md:text-5xl">
        Sign In With Quickbooks
      </h1>
      <Form {...form}>
        <form
          id="SignInForm"
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input placeholder="Password" type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-col justify-end gap-4 md:flex-row">
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
