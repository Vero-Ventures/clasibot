'use client';

import { signIn } from 'next-auth/react';

export const ChangeCompanyButton = () => {
  return (
    <button
      id="ChangeCompanyButton"
      className="mb-2 flex min-w-52 transform items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-3 text-white shadow-md transition-transform duration-300 ease-in-out hover:scale-105 hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 lg:w-full lg:min-w-0"
      // When logged in, the signIn function takes User to Company selection, functioning as a change Company button.
      onClick={() => signIn('quickbooks', { callbackUrl: '/home' })}>
      <span id="ButtonText" className="text-lg font-semibold md:text-2xl">
        Switch Company
      </span>
    </button>
  );
};
