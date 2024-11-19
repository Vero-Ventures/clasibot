'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

export const SBKConfirmationModal = () => {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      // router.push('/add-sbk-instructions');
    }, 4000);

    return () => clearTimeout(timer);
  });

  return (
    <div
      className={`fixed left-0 top-0 flex h-full w-full items-center justify-center bg-gray-900 bg-opacity-50`}>
      <div className="mx-4 flex w-96 flex-col space-y-4 rounded-lg bg-white p-6">
        <h2 className="text-center text-2xl font-bold">
          Please Connect To The Clasibot Bookkeeper
        </h2>

        <p className="text-center font-medium text-gray-800">
          Before you reviewing your transactions,
          <span className="block">please ensure the Clasibot bookkeeper</span>
          <span className="block">is connected to you through QuickBooks.</span>
        </p>
        <p className="text-center font-medium text-gray-800">
          Click below for a step-by-step tutorial on connecting to the Clasibot
          bookkeeper.
        </p>
        <Button
          className="text-md mx-auto h-12 w-44 rounded bg-blue-500 px-4 py-4 text-center font-bold text-white hover:bg-blue-600"
          onClick={() => router.push('/add-sbk-instructions')}>
          Connect To Clasibot
        </Button>
      </div>
    </div>
  );
};
