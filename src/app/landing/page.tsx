import React from 'react';
import { WelcomeSection } from './WelcomeSection';
import { HowItWorksSection } from './HowItWorksSection';
import { WhyQuickBooksSection } from './WhyQuickBooksSection';
import { DemoSection } from './DemoSection';

const Page = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto px-4 py-6">
        <WelcomeSection />
        <HowItWorksSection />
        <WhyQuickBooksSection />
        <DemoSection />
      </main>
    </div>
  );
};

export default Page;
