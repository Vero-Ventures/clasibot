'use client';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

const SignOutButton = () => {
  return (
    <Button
      id="SignOutButton"
      variant="link"
      className="text-white font-bold underline underline-offset-4 bg-gray-700 hover:bg-gray-500 !mb-1 md:!mb-0"
      onClick={() => signOut({ callbackUrl: '/' })}>
      Sign Out
    </Button>
  );
};

// Export the SignOutButton component.
export default SignOutButton;
