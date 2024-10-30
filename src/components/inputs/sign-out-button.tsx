'use client';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

const SignOutButton = () => {
  return (
    <Button
      id="SignOut"
      variant="link"
      className="!mb-1 bg-gray-700 font-bold text-white underline underline-offset-4 hover:bg-gray-500 md:!mb-0"
      onClick={() => signOut({ callbackUrl: '/' })}>
      Sign Out
    </Button>
  );
};

// Export the SignOutButton component.
export default SignOutButton;
