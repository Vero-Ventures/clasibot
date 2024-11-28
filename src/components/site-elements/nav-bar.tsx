'use server';

import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

import Link from 'next/link';
import Image from 'next/image';

import { checkCompanyConnection } from '@/actions/backend-actions/database-functions/index';

import { siteConfig } from '@/site-config/site';

import logo from '@/public/logo.svg';

import { NavBarSesssionButtons } from './nav-bar-session-buttons';

export async function Navbar() {
  // Check the user's Subscription status and set the connected state with the result.
  const connectionResult = await checkCompanyConnection();

  // Get get the server session and extract the user email.
  const session = await getServerSession(options);
  const userEmail = session?.user?.email ?? '';

  // Define and record the Stripe portal URL using the user's email. Takes user to a profile management page.
  const stripeUrl = `${process.env.STRIPE_CUSTOMER_PORTAL}?prefilled_email=${encodeURIComponent(userEmail)}`;

  return (
    <nav className="flex flex-col items-center justify-between bg-gray-900 px-6 py-4 md:flex-row md:justify-start">
      <div
        className={`mt-2 flex w-fit flex-col items-center justify-between ${session?.user ? 'mb:w-full' : ''}`}>
        <div className="flex items-center space-x-4 md:min-w-48">
          <Link href="/">
            <Image
              id="LogoImage"
              src={logo}
              width={40}
              height={40}
              className="w-12"
              alt={siteConfig.name}
            />
          </Link>
          <Link href="/">
            <div className="flex-col">
              <div className="text-2xl font-bold text-green-400">
                {siteConfig.name}
              </div>
              <div className="text-sm text-gray-300">
                Transaction Classifier
              </div>
            </div>
          </Link>
        </div>

        <div className={`w-full ${session?.user ? '' : 'hidden'} `}>
          <NavBarSesssionButtons
            connectionStatus={connectionResult.connected}
            stripeUrl={stripeUrl}
          />
        </div>
      </div>
      {!session?.user && (
        <div className="flex flex-col items-center justify-evenly gap-y-4 pt-4 mb:flex-row mb:gap-x-6 sm:gap-x-8 md:mt-2 md:w-full md:px-4 md:py-0">
          <a
            href="#how-it-works"
            className="w-56 transform rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-2 text-center text-lg font-semibold text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:bg-opacity-60 hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 mb:w-32 sm:w-40 md:w-36 lg:w-48">
            How It Works
          </a>

          <a
            href="#why-clasibot"
            className="w-56 transform rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-2 text-center text-lg font-semibold text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:bg-opacity-60 hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 mb:w-32 sm:w-40 md:w-36 lg:w-48">
            Why Use Clasibot
          </a>

          <a
            href="#intro-video"
            className="w-56 transform rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-2 text-center text-lg font-semibold text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:bg-opacity-60 hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 mb:w-32 sm:w-40 md:w-36 lg:w-48">
            Tutorial Video
          </a>
        </div>
      )}
    </nav>
  );
}
