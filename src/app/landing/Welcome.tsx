'use client';

import React from 'react';

import { SignInButton } from '@/components/inputs/index';

import welcomeBackground from './welcome.jpg';

export const Welcome = () => {
  return (
    <section className="transform rounded-lg bg-white px-8 py-10 text-center shadow-lg transition-all duration-500 hover:scale-105 hover:shadow-2xl">
      <div className="flex flex-col items-center rounded-lg landingImg:flex-row landingImg:text-left">
        <div className="flex flex-col items-center justify-center space-y-4 p-6 landingImg:w-1/2 landingImg:space-y-8">
          <h1 className="text-center text-4xl font-bold">
            Welcome to Clasibot
          </h1>
          <p className="text-center text-xl text-gray-700 mb:w-96 landingImg:w-80 lg:w-96">
            Helping you to classify expense transactions and assign tax codes
            with ease.
          </p>
          <div className="flex flex-col items-center">
            <SignInButton />
          </div>
        </div>

        <div
          className="h-full w-full rounded-lg bg-cover bg-center landingImg:ml-4 landingImg:h-96 landingImg:w-1/2 lg:ml-0"
          style={{
            backgroundImage: `url(${welcomeBackground.src})`,
            backgroundSize: 'cover',
            backgroundPosition: '30%',
          }}></div>
      </div>
    </section>
  );
};
