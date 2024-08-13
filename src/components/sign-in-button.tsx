'use client';
import { signIn } from 'next-auth/react';
import { FaArrowRight } from 'react-icons/fa';

const SignInButton = () => {
  return (
    <button
      id="QuickBooksSignInButton"
      className="flex items-center justify-center text-white bg-gradient-to-r from-blue-500 to-blue-700
      hover:from-blue-600 hover:to-blue-800 transition-transform transform hover:scale-105 duration-300 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 rounded-lg shadow-md px-6 py-3"
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
