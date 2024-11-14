'use client';

import React from 'react';

import { SignInButton } from '@/components/inputs/index';

export const Demo = () => {
  return (
    <div>
      <section
        id="demo"
        className="mb-8 transform rounded-lg bg-white px-4 py-10 shadow-lg transition-transform duration-500 hover:scale-105 hover:shadow-2xl">
        <div className="flex flex-col items-center md:flex-row">
          {/* Left Side: Content */}
          <div className="flex flex-col items-center justify-center p-4 px-8 md:w-1/2">
            <h2 className="mb-4 text-center text-3xl font-bold text-gray-800">
              See Clasibot in Action
            </h2>
            <p className="mb-6 text-center text-lg text-gray-700">
              Experience how Clasibot seamlessly integrates with QuickBooks to
              automate your transaction classification.
            </p>

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
                <span className="text-base">Quick and easy setup process.</span>
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
                  Automated classification with high accuracy.
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
                  Real-time updates and seamless QuickBooks integration.
                </span>
              </li>
            </ul>

            <SignInButton />
          </div>

          {/* Right Side: Embed YouTube Video with Consistent Size */}
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
      <section
        id="mobileDemoVideo"
        className="mb-8 transform rounded-lg bg-white px-4 py-10 shadow-lg transition-transform duration-500 hover:scale-105 hover:shadow-2xl md:hidden">
        <div className="h-80 rounded-lg">
          <iframe
            className="absolute left-0 top-0 h-full w-full rounded-lg"
            src="https://www.youtube.com/embed/qytiCd-tAUo"
            title="Clasibot Demo Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen></iframe>
        </div>
      </section>
    </div>
  );
};
