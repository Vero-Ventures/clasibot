'use client';

import { useRouter } from 'next/navigation';
import React from 'react';
import welcomeBackground from './welcome_background_1.jpg';
import { Button } from '@/components/ui/button';

export const WelcomeSection = () => {
  const router = useRouter();

  return (
    <section className="mb-8 transform rounded-lg bg-white px-8 py-10 text-center shadow-lg transition-transform duration-500 hover:scale-105 hover:shadow-2xl">
      <div className="flex flex-col items-center rounded-lg md:flex-row md:text-left">
        <div className="flex flex-col items-center justify-center p-4 md:w-1/2">
          <h1 className="mb-4 text-center text-4xl font-bold text-black">
            Welcome to Clasibot
          </h1>
          <p className="mb-6 text-center text-lg text-gray-700">
            Automate your transaction classification with ease.
          </p>
          <div className="flex flex-col items-center space-y-4">
            <Button
              className="flex transform items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 px-6 py-3 text-white shadow-md transition-transform duration-300 ease-in-out hover:scale-105 hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
              onClick={() => router.push('/quickbooks-signin')}>
              Sign In with QuickBooks
            </Button>
          </div>
        </div>
        <div
          className="h-full w-full rounded-lg bg-cover bg-center md:h-96 md:w-1/2"
          style={{
            backgroundImage: `url(${welcomeBackground.src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}></div>
      </div>
    </section>
  );
};
