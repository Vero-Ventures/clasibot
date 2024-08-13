'use client';
import { signIn } from 'next-auth/react';

const ChangeCompanyButton = () => {
  return (
    <button
      id="ChangeCompanyButton"
      className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 rounded-lg shadow-md
      transition-transform transform hover:scale-105 duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75
      text-white px-4 md:px-4 lg:px-8 xl:px-20 py-3 lg:py-4 mb-2 md:mb-0 md:ml-8 lg:ml-10 md:mr-8"
      // Define onClick event to trigger the signIn function with the QuickBooks provider.
      // When logged in, signIn function takes user to company selection element in QBO.
      onClick={() => signIn('quickbooks', { callbackUrl: '/home' })}>
      <span id="ButtonText" className="text-lg">
        Switch Company
      </span>
    </button>
  );
};

// Export the ChangeCompanyButton component.
export default ChangeCompanyButton;
