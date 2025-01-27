import React from 'react';

import { Welcome, HowItWorks, WhyClasibot, IntroVideo } from './index';

const Page = () => {
  return (
    <div className="min-h-screen w-full bg-gray-100">
      <main className="container mx-auto px-6 py-6 mb:px-8 md:px-10 lg:px-12">
        <Welcome />

        <div id="how-it-works" />
        <HowItWorks />

        <div id="why-clasibot" />
        <WhyClasibot />

        <div id="intro-video" />
        <IntroVideo />
      </main>
    </div>
  );
};

export default Page;
