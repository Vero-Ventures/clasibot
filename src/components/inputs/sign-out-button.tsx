'use client';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

const SignOutButton = () => {
  return (
    <Button
      id="SignOut"
      variant="link"
      className="md:!min-w-30 !mb-1 w-36 bg-gray-700 font-bold text-white hover:bg-gray-500 mb:translate-x-3 md:!mb-0 md:translate-x-0"
      onClick={() => signOut({ callbackUrl: '/' })}>
      Sign Out
    </Button>
  );
};

// Export the SignOutButton component.
export default SignOutButton;
