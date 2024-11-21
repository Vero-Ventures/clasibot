import React from 'react';

import { Welcome } from './Welcome';
import { HowItWorks } from './HowItWorks';
import { WhyClasibot } from './WhyClasibot';
import { Demo } from './IntroVideo';

const Page = () => {
  return (
    <div className="min-h-screen w-full bg-gray-100">
      <main className="container mx-auto px-6 py-6 mb:px-8 md:px-10 lg:px-12">
        <Welcome />
        <HowItWorks />
        <WhyClasibot />
        <Demo />
      </main>
    </div>
  );
};

export default Page;
