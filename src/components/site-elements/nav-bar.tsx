'use server';

import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

import Link from 'next/link';
import Image from 'next/image';

import { checkCompanyConnection } from '@/actions/backend-actions/database-functions/index';

import { siteConfig } from '@/site-config/site';

import logo from '@/public/logo.svg';

import {
  SignOutButton,
  ChangeCompanyButton,
  DeactivationButton,
  ManageAccountButton,
} from '@/components/inputs/index';

export async function Navbar() {
  // Check the user's Subscription status.
  const connectionStatus = await checkCompanyConnection();

  // Get get the server session and extract the user name and email.
  const session = await getServerSession(options);
  const userEmail = session?.user?.email ?? '';

  // Define the Stripe portal URL using the user's email. Takes user to a profile management page.
  const stripePortalUrl = `${process.env.STRIPE_CUSTOMER_PORTAL}?prefilled_email=${encodeURIComponent(userEmail)}`;

  return (
    <nav className="flex flex-col items-center justify-between bg-gray-900 px-6 py-4 shadow-md md:flex-row md:justify-start md:pl-12 lg:pl-16">
      <div className="mt-2 flex w-full flex-col items-center justify-between shadow-md md:w-fit">
        <div className="flex items-center space-x-4 md:min-w-48 lg:mx-0">
          <Link href="/">
            <Image
              id="LogoImage"
              src={logo}
              width={40}
              height={40}
              className="h-auto w-12"
              alt={siteConfig.name}
            />
          </Link>
          <Link href="/">
            <div className="flex flex-col">
              <div className="text-2xl font-bold text-white">
                <span className="text-green-400">{siteConfig.name}</span>
              </div>
              <div className="text-sm text-gray-300">
                Transaction Classifier
              </div>
            </div>
          </Link>
        </div>
        <div className={` ${session?.user ? '' : 'hidden'} `}>
          <UserSessionButtons stripePortalUrl={stripePortalUrl} />
          <UserCompanyButtons connectionStatus={connectionStatus} />
        </div>
      </div>
      {!session?.user && (
        <div className="mt-4 flex flex-col items-center justify-evenly gap-y-4 py-2 mb:flex-row mb:gap-x-6 sm:gap-x-8 md:mt-2 md:w-full md:px-4 md:py-0">
          <a
            href="#how-it-works"
            className="w-48 transform rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 p-2 text-center text-lg font-semibold text-white shadow-md transition-transform duration-300 ease-in-out hover:scale-105 hover:bg-opacity-60 hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 mb:w-32 sm:w-40 md:w-28 lg:w-48">
            How It&nbsp;
            <span className="mb:block sm:inline-block">Works</span>
          </a>
          <a
            href="#why-quickbooks"
            className="w-48 transform rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 p-2 text-center text-lg font-semibold text-white shadow-md transition-transform duration-300 ease-in-out hover:scale-105 hover:bg-opacity-60 hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 mb:w-32 sm:w-40 md:w-28 lg:w-48">
            Why QuickBooks
          </a>
          <a
            href="#demo"
            className="w-48 transform rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 p-2 text-center text-lg font-semibold text-white shadow-md transition-transform duration-300 ease-in-out hover:scale-105 hover:bg-opacity-60 hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 mb:w-32 sm:w-40 md:w-28 lg:w-48">
            Clasibot Demo
          </a>
        </div>
      )}
    </nav>
  );
}

// Define interface for data used in the user session info elements.
interface UserSessionButtonsProps {
  stripePortalUrl: string;
}

// Takes the Stripe portal URL.
const UserSessionButtons: React.FC<UserSessionButtonsProps> = ({
  stripePortalUrl,
}) => {
  return (
    <div className="flex flex-col mb:w-full mb:flex-row mb:justify-evenly md:justify-evenly lg:gap-x-4">
      <div className={`mt-6 w-fit`}>
        <ManageAccountButton stripePortalUrl={stripePortalUrl} />
      </div>
      <div className={`mt-6 w-fit`}>
        <SignOutButton />
      </div>
    </div>
  );
};

// Define interface for data used in the user Company info elements.
interface UserCompanyButtonsProps {
  connectionStatus: {
    connected: boolean;
    result: string;
    message: string;
  };
}

// Takes the connection status result object.
const UserCompanyButtons: React.FC<UserCompanyButtonsProps> = ({
  connectionStatus,
}) => {
  return (
    <div className="flex flex-col mb:w-full mb:flex-row mb:justify-evenly md:justify-evenly lg:gap-x-4">
      <div className={`mt-6 w-fit`}>
        <ChangeCompanyButton />
      </div>
      <div className={`mt-6 w-fit`}>
        <DeactivationButton connectionStatus={connectionStatus} />
      </div>
    </div>
  );
};
