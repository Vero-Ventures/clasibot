'use client';
import { signIn } from 'next-auth/react';
import { FaArrowRight } from 'react-icons/fa';

const SignInButton = () => {
  return (
    <button
      id="QuickBooksSignInButton"
      className="flex transform items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 px-6 py-3 text-white shadow-md transition-transform duration-300 ease-in-out hover:scale-105 hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
      onClick={() => signIn('quickbooks', { callbackUrl: '/home' })}>
      <span id="SignInButtonText" className="mr-2 text-lg">
        Sign in with QuickBooks
      </span>
      <FaArrowRight id="ButtonCallToActionArrow" className="text-xl" />
    </button>
  );
};

// Export the SignInButton component.
export default SignInButton;
