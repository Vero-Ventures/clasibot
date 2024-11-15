'use client';

import React from 'react';

import { SignInButton } from '@/components/inputs/index';

import quickbooks from './quickbooks.jpg';

export const WhyClasibot = () => {
  return (
    <section className="mb-8 transform rounded-lg bg-white px-4 py-10 shadow-lg transition-transform duration-500 hover:scale-105 hover:shadow-2xl">
      <div className="flex flex-col items-center md:flex-row">
        <div
          className="h-full w-full rounded-lg bg-cover bg-center md:h-96 md:w-1/2"
          style={{
            backgroundImage: `url(${quickbooks.src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}></div>

        <div className="flex flex-col items-center justify-center p-4 md:w-1/2 md:pl-8">
          <h2 className="mb-4 text-center text-3xl font-bold text-gray-800">
            Why QuickBooks
          </h2>
          <p className="mb-6 text-center text-lg text-gray-700">
            Clasibot simplifies transaction classification, saving you time by
            automating routine tasks. By integrating with QuickBooks, you get
            seamless, weekly updates to your transactions.
          </p>

          <ul className="mb-6 space-y-4 text-lg text-gray-700">
            <li className="flex items-start">
              <span className="mr-2 translate-y-1.5 text-green-500">
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
              <span className="mr-2 translate-y-1.5 text-green-500">
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
              <span className="mr-2 translate-y-1.5 text-green-500">
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
          <SignInButton />
        </div>
      </div>
    </section>
  );
};
