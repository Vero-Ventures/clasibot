import React from 'react';
import { FaSearch, FaDatabase, FaRobot } from 'react-icons/fa';

export const HowItWorks = () => (
  <section className="mt-8 transform rounded-lg bg-white px-8 py-10 shadow-lg transition-all duration-500 hover:scale-105 hover:shadow-2xl">
    <h2 className="mb-8 text-center text-3xl font-bold text-gray-800">
      How It Works
    </h2>
    <div className="flex flex-col space-y-8 sm:flex-row sm:space-x-6 sm:space-y-0">
      <Step
        iconColor="bg-blue-500"
        IconComponent={FaSearch}
        title="Analyzing Past Transactions"
        description="Clasibot synchronizes with your past transaction classifications, creating predictions that match your business history."
      />

      <Step
        iconColor="bg-green-500"
        IconComponent={FaDatabase}
        title="Database Matching"
        description="We check against our ever-growing database of transactions, finding common classifications and identifying the most likely matches."
      />

      <Step
        iconColor="bg-purple-500"
        IconComponent={FaRobot}
        title="AI Learning Predictions"
        description="Our AI system uses online business data to identify likely classifications and tax codes, offering reliable results for any transaction."
      />
    </div>
  </section>
);

interface StepProps {
  iconColor: string;
  IconComponent: React.ElementType;
  title: string;
  description: string;
}

const Step: React.FC<StepProps> = ({
  iconColor,
  IconComponent,
  title,
  description,
}) => (
  <div className="flex-1 text-center sm:px-2 md:px-4">
    <div
      className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${iconColor}`}>
      <IconComponent className="h-8 w-8 text-white" />
    </div>
    <h3 className="mx-auto mb-2 content-center text-xl font-semibold text-gray-800 sm:min-h-14 lg:min-h-fit">
      {title}
    </h3>
    <p className="text-gray-700">{description}</p>
  </div>
);
