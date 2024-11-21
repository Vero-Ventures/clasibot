import React from 'react';

import { Welcome } from './Welcome';
import { HowItWorks } from './HowItWorks';
import { WhyClasibot } from './WhyClasibot';
import { Demo } from './IntroVideo';

const Page = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto px-8 py-6 md:px-10 lg:px-12">
        <Welcome />
        <HowItWorks />
        <WhyClasibot />
        <Demo />
      </main>
    </div>
  );
};

export default Page;
