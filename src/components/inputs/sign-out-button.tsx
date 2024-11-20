'use client';

import { signOut } from 'next-auth/react';

export const SignOutButton = () => {
  return (
    <button
      className="flex min-w-[136px] transform items-center justify-center rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-8 py-3 text-white shadow-md transition-transform duration-300 ease-in-out hover:scale-105 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 md:h-[80px] md:w-32 lg:h-fit lg:min-w-52"
      onClick={() => signOut({ callbackUrl: '/' })}>
      <span className="text-lg font-semibold">Sign Out</span>
    </button>
  );
};
