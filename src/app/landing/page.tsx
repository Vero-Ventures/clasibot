'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showWhyQuickBooks, setShowWhyQuickBooks] = useState(false);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto px-4 py-6">
        {' '}
        {/* Welcome Section */}
        <section className="mb-8 transform rounded-lg bg-white px-8 py-10 text-center shadow-lg transition-transform duration-500 hover:scale-105 hover:shadow-2xl">
          <h1 className="mb-4 text-4xl font-bold text-gray-800">
            Welcome to Clasibot
          </h1>
          <p className="mb-6 text-lg text-gray-600">
            Automate your transaction classification with ease.
          </p>
          <button
            className="rounded-full bg-blue-500 px-8 py-3 text-lg text-white transition hover:bg-blue-600"
            onClick={() => router.push('/')}
          >
            Get Started
          </button>
        </section>
        {/* How it Works Section */}
        <section className="mb-8 transform rounded-lg bg-white px-8 py-6 shadow-lg transition-transform duration-500 hover:scale-105 hover:shadow-2xl">
          <h2
            className="mb-4 cursor-pointer text-center text-3xl font-bold text-gray-800"
            onClick={() => setShowHowItWorks(!showHowItWorks)}>
            How it Works
          </h2>
          <div
            className={`transition-max-height overflow-hidden duration-500 ease-in-out ${
              showHowItWorks ? 'max-h-screen' : 'max-h-0'
            }`}>
            <p className="mb-6 text-lg text-gray-700">
              Clasibot makes use of a three-step classification pipeline system
              to automatically classify your transactions with high accuracy.
            </p>
            <ol className="list-inside list-decimal space-y-4 text-lg text-gray-700">
              {' '}
              <li className="pl-4">
                Clasibot reviews past transactions to find matches, predicting
                classifications to reduce manual input.
              </li>
              <li className="pl-4">
                It checks against our database, finding common classifications
                and comparing them for the highest likelihood match.
              </li>
              <li className="pl-4">
                Our AI system uses vendor data to predict classifications and
                tax codes, offering reliable results for every transaction.
              </li>
            </ol>
          </div>
        </section>
        {/* Why QuickBooks Section */}
        <section className="mb-8 transform rounded-lg bg-white px-8 py-6 shadow-lg transition-transform duration-500 hover:scale-105 hover:shadow-2xl">
          <h2
            className="mb-4 cursor-pointer text-center text-3xl font-bold text-gray-800"
            onClick={() => setShowWhyQuickBooks(!showWhyQuickBooks)}>
            Why QuickBooks
          </h2>
          <div
            className={`transition-max-height overflow-hidden duration-500 ease-in-out ${
              showWhyQuickBooks ? 'max-h-screen' : 'max-h-0'
            }`}>
            <p className="mb-6 text-lg text-gray-700">
              Clasibot simplifies transaction classification, saving you time
              and automating routine tasks. By integrating with QuickBooks, you
              get seamless, weekly updates to your transactions.
            </p>
            <p className="mb-6 text-lg text-gray-700">
              Our goal is to minimize repetitive processes, allowing you to
              focus on the work that matters most. Clasibot evaluates each
              transaction to recommend the most probable classification.
            </p>
            <p className="mb-6 text-lg text-gray-700">
              If multiple classifications are possible, Clasibot presents a
              dropdown of options in order of likelihood, making it easy to
              handle even the most unique transactions.
            </p>
          </div>
        </section>
        {/* Demo Video Section */}
        <section className="mb-8 transform rounded-lg bg-white px-8 py-10 text-center shadow-lg transition-transform duration-500 hover:scale-105 hover:shadow-2xl">
          <h2 className="mb-4 text-3xl font-bold text-gray-800">
            The QuickBooks Process
          </h2>
          <p className="mb-6 text-lg text-gray-700">Demo Video (Coming Soon)</p>
          <div className="mx-auto flex h-64 w-full max-w-lg items-center justify-center rounded-lg bg-gray-200">
            <span className="text-2xl text-gray-500">Video Placeholder</span>
          </div>
        </section>
      </main>
    </div>
  );
}
