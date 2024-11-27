'use client';

import React from 'react';

import quickbooks from './qb.jpg';

export const WhyClasibot = () => {
  return (
    <section className="mt-8 transform rounded-lg bg-white px-4 py-10 shadow-lg transition-all duration-500 hover:scale-105 hover:shadow-2xl">
      <div className="flex flex-col items-center md:flex-row">
        <div
          className="h-full w-full rounded-lg bg-cover bg-center md:h-96 md:w-1/2"
          style={{
            backgroundImage: `url(${quickbooks.src})`,

            backgroundPosition: '16%',
          }}></div>

        <div className="flex flex-col items-center justify-center p-4 md:w-1/2 md:pl-6">
          <h2 className="mb-4 text-center text-3xl font-bold text-gray-800">
            Why Use Clasibot?
          </h2>
          <p className="mb-6 text-center text-lg text-gray-700">
            Clasibot simplifies the process of classification and tax code
            assignment, saving you time by automating the transaction review
            process.
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
                QuickBooks Online integration allows seamlessly review of your
                newest transactions. Our system checks for new transactions on every review for the most up to date classifications.
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
                Straightforward design makes the review process as quick and
                easy as possible. Approved transactions are automatically
                updated on QuickBooks Online.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};
