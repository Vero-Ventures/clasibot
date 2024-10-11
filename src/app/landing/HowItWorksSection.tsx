import React from 'react';

export const HowItWorksSection = () => (
  <section
    id="how-it-works"
    className="mb-8 transform rounded-lg bg-white px-4 py-10 shadow-lg transition-transform duration-500 hover:scale-105 hover:shadow-2xl">
    <h2 className="mb-8 text-center text-3xl font-bold text-gray-800">
      How It Works
    </h2>
    <div className="flex flex-col space-y-8 md:flex-row md:space-x-6 md:space-y-0">
      <Step
        iconColor="bg-blue-500"
        iconPath="M10 4a6 6 0 100 12 6 6 0 000-12zm8 8l-4.35-4.35"
        title="Analyze Past Transactions"
        description="Clasibot reviews past transactions to find matches, predicting classifications to reduce manual input."
      />
      <Step
        iconColor="bg-green-500"
        iconPath="M12 4c-4.418 0-8 1.79-8 4v8c0 2.21 3.582 4 8 4s8-1.79 8-4V8c0-2.21-3.582-4-8-4z"
        title="Database Matching"
        description="It checks against our database, finding common classifications and comparing them for the highest likelihood match."
      />
      <Step
        iconColor="bg-purple-500"
        iconPath="M12 2a7 7 0 00-7 7c0 3.48 2.55 6.39 5.91 6.92L10 22h4l-.91-6.08A7.001 7.001 0 0019 9a7 7 0 00-7-7z"
        title="AI Prediction"
        description="Our AI system uses vendor data to predict classifications and tax codes, offering reliable results for every transaction."
      />
    </div>
  </section>
);

interface StepProps {
  iconColor: string;
  iconPath: string;
  title: string;
  description: string;
}

const Step: React.FC<StepProps> = ({ iconColor, iconPath, title, description }) => (
  <div className="flex-1 text-center">
    <div
      className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${iconColor}`}>
      <svg
        className="h-8 w-8 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d={iconPath}
        />
      </svg>
    </div>
    <h3 className="mb-2 text-xl font-semibold text-gray-800">{title}</h3>
    <p className="text-gray-700">{description}</p>
  </div>
);
