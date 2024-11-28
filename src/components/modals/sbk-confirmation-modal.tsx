'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

export const SBKConfirmationModal = () => {
  const router = useRouter();

  return (
    <div
      className={`fixed left-0 top-0 flex h-full w-full items-center justify-center bg-gray-900 bg-opacity-50`}>
      <div className="mx-4 flex w-96 flex-col space-y-4 rounded-lg bg-white p-6">
        <h2 className="text-center text-2xl font-bold">
          Please Invite The Clasibot Bookkeeper
        </h2>

        <p className="py-2 text-center text-gray-800">
          Before reviewing your transactions, please ensure the Clasibot
          Bookkeeper is connected to your QuickBooks account.
        </p>
        <p className="text-center font-semibold text-gray-800">
          Click below for a step-by-step tutorial on inviting the Clasibot
          bookkeeper.
        </p>
        <Button
          className="text-md mx-auto h-12 w-44 rounded bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-4 text-center font-bold text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
          onClick={() => router.push('/connection-instructions')}>
          Invite Instructions
        </Button>
      </div>
    </div>
  );
};
