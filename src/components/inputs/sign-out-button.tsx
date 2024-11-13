'use client';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export const SignOutButton = () => {
  return (
    <Button
      id="SignOut"
      variant="link"
      className="mb-1 bg-gray-700 font-bold text-white hover:bg-gray-500 mb:min-w-40 mb:text-lg md:p-6"
      onClick={() => signOut({ callbackUrl: '/' })}>
      Sign Out
    </Button>
  );
};
