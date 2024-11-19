'use client';

import React from 'react';

import { SignInButton } from '@/components/inputs/index';

export const Demo = () => {
  return (
    <div>
      <section className="mb-8 transform rounded-lg bg-white px-4 py-10 shadow-lg transition-transform duration-500 hover:scale-105 hover:shadow-2xl md:hidden">
        <div className="h-80 rounded-lg">
          <iframe
            className="absolute left-0 top-0 h-full w-full rounded-lg"
            src="https://www.youtube.com/embed/qytiCd-tAUo"
            title="Clasibot Demo Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen></iframe>
        </div>
      </section>
      <section className="mb-8 transform rounded-lg bg-white px-4 py-10 shadow-lg transition-transform duration-500 hover:scale-105 hover:shadow-2xl">
        <div className="flex flex-col items-center md:flex-row">
          <div className="flex flex-col items-center justify-center p-4 px-8 md:w-1/2">
            <h2 className="mb-4 text-center text-3xl font-bold text-gray-800">
              See Clasibot in Action
            </h2>

            <ul className="mb-6 space-y-4 text-lg text-gray-700">
              <li className="flex items-start">
                <span className="mr-2 translate-y-1.5 text-blue-500">
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
                  Provides an example of the QuickBooks Online connection
                  process.
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 translate-y-1.5 text-blue-500">
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
                  Shows how Clasibot works with your QuickBooks Online account.
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 translate-y-1.5 text-blue-500">
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
                  Contains a step-by-step walkthrough of an example Clasibot
                  session.
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 translate-y-1.5 text-blue-500">
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
                  Offers a detailed breakdown of the features that Clasibot
                  offers.
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 translate-y-1.5 text-blue-500">
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
                  Provides tips on how to get the most out of Clasibot.
                </span>
              </li>
            </ul>
            <SignInButton />
          </div>

          <div className="h-full w-full rounded-lg bg-cover bg-center md:h-96 md:w-1/2">
            <div className="relative h-full w-full">
              <iframe
                className="absolute left-0 top-0 h-full w-full rounded-lg"
                src="https://www.youtube.com/embed/qytiCd-tAUo"
                title="Clasibot Demo Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen></iframe>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
