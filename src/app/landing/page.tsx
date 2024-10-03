'use client';


import { useRouter } from 'next/navigation';
import React from 'react';
import welcomeBackground from './welcome_background_1.jpg';
import quickbooks from './quickbooks.jpg';
import videoPlayer from './videoplayer.jpg';


export default function Page() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <header className="bg-white shadow">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Clasibot</h1>
          <nav>
            <a
              href="#how-it-works"
              className="mx-4 text-gray-600 hover:text-blue-500">
              How it Works
            </a>
            <a
              href="#why-quickbooks"
              className="mx-4 text-gray-600 hover:text-blue-500">
              Why QuickBooks
            </a>
            <a href="#demo" className="mx-4 text-gray-600 hover:text-blue-500">
              Demo
            </a>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <section className="mb-8 transform rounded-lg bg-white px-8 py-10 text-center shadow-lg transition-transform duration-500 hover:scale-105 hover:shadow-2xl">
          <div className="mb-8 flex flex-col items-center rounded-lg bg-white px-8 py-10 text-center shadow-lg transition-transform duration-500 hover:scale-105 hover:shadow-2xl md:flex-row md:text-left">
            {/* Left Side: Welcome Message and Buttons */}
            <div className="flex flex-col items-center justify-center p-4 md:w-1/2">
              <h1 className="mb-4 text-center text-4xl font-bold text-black">
                Welcome to Clasibot
              </h1>
              <p className="mb-6 text-center text-lg text-gray-700">
                Automate your transaction classification with ease.
              </p>
              {/* Buttons Container */}
              <div className="flex flex-col items-center space-y-4">
                <button
                  className="w-full max-w-xs transform rounded-full px-8 py-3 text-lg text-white transition duration-300 hover:scale-105"
                  style={{
                    background: 'linear-gradient(to right, #54879a, #305468)',
                  }}
                  onClick={() => router.push('/')}>
                  Get Started with QuickBooks
                </button>
                <button
                  className="w-full max-w-xs transform rounded-full px-8 py-3 text-lg text-white transition duration-300 hover:scale-105"
                  style={{
                    background: 'linear-gradient(to right, #54879a, #305468)',
                  }}
                  onClick={() => router.push('/quickbooks-signin')}>
                  Sign In with QuickBooks
                </button>
              </div>
            </div>

            {/* Right Side: Background Image */}
            <div
              className="h-full w-full rounded-lg bg-cover bg-center md:h-96 md:w-1/2"
              style={{
                backgroundImage: `url(${welcomeBackground.src})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}></div>
          </div>
        </section>

        {/* How it Works Section */}
        <section
          id="how-it-works"
          className="mb-8 transform rounded-lg bg-white px-4 py-10 shadow-lg transition-transform duration-500 hover:scale-105 hover:shadow-2xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-800">
            How It Works
          </h2>
          <div className="flex flex-col space-y-8 md:flex-row md:space-x-6 md:space-y-0">
            {/* Step 1 */}
            <div className="flex-1 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500">
                {/* Icon for Step 1 */}
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 4a6 6 0 100 12 6 6 0 000-12zm8 8l-4.35-4.35"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-800">
                Analyze Past Transactions
              </h3>
              <p className="text-gray-700">
                Clasibot reviews past transactions to find matches, predicting
                classifications to reduce manual input.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex-1 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
                {/* Icon for Step 2 */}
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4c-4.418 0-8 1.79-8 4v8c0 2.21 3.582 4 8 4s8-1.79 8-4V8c0-2.21-3.582-4-8-4z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-800">
                Database Matching
              </h3>
              <p className="text-gray-700">
                It checks against our database, finding common classifications
                and comparing them for the highest likelihood match.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex-1 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500">
                {/* Icon for Step 3 */}
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 2a7 7 0 00-7 7c0 3.48 2.55 6.39 5.91 6.92L10 22h4l-.91-6.08A7.001 7.001 0 0019 9a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-800">
                AI Prediction
              </h3>
              <p className="text-gray-700">
                Our AI system uses vendor data to predict classifications and
                tax codes, offering reliable results for every transaction.
              </p>
            </div>
          </div>
        </section>

        {/* Why QuickBooks Section */}
        <section
          id="why-quickbooks"
          className="mb-8 transform rounded-lg bg-white px-4 py-10 shadow-lg transition-transform duration-500 hover:scale-105 hover:shadow-2xl">
          <div className="flex flex-col items-center md:flex-row">
            {/* Left Side: Illustration */}
            <div className="mb-6 md:mb-0 md:w-1/2 md:pr-6">
              <img
                src={quickbooks.src}
                alt="QuickBooks Integration"
                className="h-auto w-full"
              />
            </div>

            {/* Right Side: Content */}
            <div className="md:w-1/2 md:pl-6">
              <h2 className="mb-4 text-3xl font-bold text-gray-800">
                Why QuickBooks
              </h2>
              <p className="mb-6 text-lg text-gray-700">
                Clasibot simplifies transaction classification, saving you time
                and automating routine tasks. By integrating with QuickBooks,
                you get seamless, weekly updates to your transactions.
              </p>
              <ul className="mb-6 space-y-4 text-lg text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2 text-green-500">
                    {/* Check Icon */}
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                  <span>
                    Automate repetitive tasks and focus on what matters most.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-green-500">
                    {/* Check Icon */}
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                  <span>
                    Seamless integration with QuickBooks for real-time updates.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-green-500">
                    {/* Check Icon */}
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                  <span>
                    Accurate classification recommendations for every
                    transaction.
                  </span>
                </li>
              </ul>
              <button
                className="mt-4 transform rounded-full px-8 py-3 text-lg text-white transition duration-300 hover:scale-105"
                style={{
                  background: 'linear-gradient(to right, #54879a, #305468)',
                }}
                onClick={() => router.push('/quickbooks-signin')}>
                Connect with QuickBooks
              </button>
            </div>
          </div>
        </section>

        {/* Demo Video Section */}
        <section
          id="demo"
          className="mb-8 transform rounded-lg bg-white px-4 py-10 shadow-lg transition-transform duration-500 hover:scale-105 hover:shadow-2xl">
          <div className="flex flex-col items-center md:flex-row">
            {/* Left Side: Content */}
            <div className="flex w-full flex-col items-center text-center md:w-1/2 md:items-start md:pr-6 md:text-left">
              <h2 className="mb-4 text-3xl font-bold text-gray-800">
                See Clasibot in Action
              </h2>
              <p className="mb-6 text-lg text-gray-700">
                Experience how Clasibot seamlessly integrates with QuickBooks to
                automate your transaction classification.
              </p>
              <ul className="mb-6 space-y-4 text-lg text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2 text-blue-500">
                    {/* Check Icon */}
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                  <span>Quick and easy setup process.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-blue-500">
                    {/* Check Icon */}
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                  <span>Automated classification with high accuracy.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-blue-500">
                    {/* Check Icon */}
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                  <span>
                    Real-time updates and seamless QuickBooks integration.
                  </span>
                </li>
              </ul>
              <button
                className="mt-4 transform rounded-full px-8 py-3 text-lg text-white transition duration-300 hover:scale-105"
                style={{
                  background: 'linear-gradient(to right, #54879a, #305468)',
                }}
                onClick={() => router.push('/quickbooks-signin')}>
                Get Started Now
              </button>
            </div>

            {/* Right Side: Video or Image */}
            <div className="mb-6 w-full md:mb-0 md:w-1/2 md:pl-6">
              {/* Video Embed or Image Placeholder */}
              <div className="relative h-0 w-full pb-[56.25%]">
                {/* If video is available, embed it */}
                {/* <iframe
          className="absolute top-0 left-0 h-full w-full rounded-lg"
          src="https://www.youtube.com/embed/your_video_id"
          title="Clasibot Demo Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe> */}

                {/* If video is not available, use an image placeholder */}
                <img
                  src={videoPlayer.src} 
                  alt="Clasibot Demo"
                  className="absolute left-0 top-0 h-full w-full rounded-lg object-cover"
                />
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-white bg-opacity-75 transition duration-300 hover:bg-opacity-100"
                    onClick={() => {
                      // Handle play button click
                    }}>
                    {/* Play Icon
                    <svg
                      className="h-8 w-8 text-gray-800"
                      fill="currentColor"
                      viewBox="0 0 20 20">
                      <path d="M6 4l12 6-12 6V4z" />
                    </svg> */}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
