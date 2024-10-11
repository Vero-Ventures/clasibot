'use client'; // Mark as client-side component

import React from 'react';
import { Button } from '@/components/ui/button'; // Importing the Button component
import { useRouter } from 'next/navigation';
import quickbooks from './quickbooks.jpg'; // Ensure this is the correct path to your image

export const WhyQuickBooksSection = () => {
  const router = useRouter();

  return (
    <section
      id="why-quickbooks"
      className="mb-8 transform rounded-lg bg-white px-4 py-10 shadow-lg transition-transform duration-500 hover:scale-105 hover:shadow-2xl">
      <div className="flex flex-col items-center md:flex-row">
        {/* Left Side: Background Image */}
        <div
          className="h-full w-full rounded-lg bg-cover bg-center md:h-96 md:w-1/2"
          style={{
            backgroundImage: `url(${quickbooks.src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}></div>

        {/* Right Side: Content */}
        <div className="flex flex-col items-center justify-center p-4 md:w-1/2">
          <h2 className="mb-4 text-3xl font-bold text-gray-800">
            Why QuickBooks
          </h2>
          <p className="mb-6 text-lg text-gray-700">
            Clasibot simplifies transaction classification, saving you time and
            automating routine tasks. By integrating with QuickBooks, you get
            seamless, weekly updates to your transactions.
          </p>

          <ul className="mb-6 space-y-4 text-lg text-gray-700">
            <li className="flex items-start">
              <span className="mr-2 text-green-500">
                <svg
                  className="h-4 w-4" 
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </span>
              <span className="text-base">
                Automate repetitive tasks and focus on what matters most.
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-green-500">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </span>
              <span className="text-base">
                Seamless integration with QuickBooks for real-time updates.
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-green-500">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </span>
              <span className="text-base">
                Accurate classification recommendations for every transaction.
              </span>
            </li>
          </ul>
          <Button
            className="flex transform items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 px-6 py-3
             text-white shadow-md transition-transform duration-300 ease-in-out hover:scale-105 hover:from-blue-600 hover:to-blue-800
              focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
            onClick={() => router.push('/quickbooks-signin')}>
            Connect with QuickBooks
          </Button>
        </div>
      </div>
    </section>
  );
};
