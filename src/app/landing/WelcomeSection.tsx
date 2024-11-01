'use client';

import React from 'react';
import welcomeBackground from './welcome_background_1.jpg';
import SignInButton from '@/components/inputs/sign-in-button';

export const WelcomeSection = () => {
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
            <SignInButton />
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
