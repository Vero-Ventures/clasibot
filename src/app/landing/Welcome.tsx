'use client';

import React from 'react';
import welcomeBackground from './welcome_background_1.jpg';
import SignInButton from '@/components/inputs/sign-in-button';

export const Welcome = () => {
  return (
    <section className="mb-8 transform rounded-lg bg-white px-8 py-10 text-center shadow-lg transition-transform duration-500 hover:scale-105 hover:shadow-2xl">
      <div className="flex flex-col items-center rounded-lg md:flex-row md:text-left">
        <div className="flex flex-col items-center justify-center space-y-4 p-6 md:w-1/2 md:space-y-8">
          <h1 className="text-center text-4xl font-bold text-black">
            Welcome to Clasibot
          </h1>
          <p className="text-center text-xl text-gray-700 mb:w-96 md:w-80 lg:w-96">
            <span className="block mb:inline-block">
              Automatically classify&nbsp;
            </span>
            <span className="block mb:inline-block">
              your transactions&nbsp;
            </span>
            <span className="block mb:inline-block">
              and tax codes with ease.
            </span>
            <span className="block mb:inline-block"></span>
          </p>
          <div className="flex flex-col items-center">
            <SignInButton />
          </div>
        </div>
        <div
          className="h-full w-full rounded-lg bg-cover bg-center md:h-96 md:w-1/2"
          style={{
            backgroundImage: `url(${welcomeBackground.src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'left',
          }}></div>
      </div>
    </section>
  );
};
