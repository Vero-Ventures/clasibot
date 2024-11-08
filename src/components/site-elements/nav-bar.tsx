import { getServerSession } from 'next-auth';
import Link from 'next/link';
import Image from 'next/image';
import { checkCompanyConnection } from '@/actions/check-db-company';
import { siteConfig } from '@/site-config/site';
import logo from '@/public/logo.svg';
import { Button } from '@/components/ui/button';
import {
  SignOutButton,
  ChangeCompanyButton,
  DeactivationButton,
} from '@/components/inputs/index';

export async function Navbar() {
  // Check the user's Subscription status.
  const connectionStatus = await checkCompanyConnection();

  // Get get the server session and extract the user name and email.
  const session = await getServerSession();
  const userEmail = session?.user?.email ?? '';

  // Define the Stripe portal URL using the user's email. Takes user to a profile management page.
  const stripePortalUrl = `${process.env.STRIPE_CUSTOMER_PORTAL}?prefilled_email=${encodeURIComponent(userEmail)}`;

  return (
    <nav className="flex flex-col items-center justify-between bg-gray-900 px-6 py-4 shadow-md lg:flex-row lg:px-8 xl:px-24">
      <div className="mt-2 flex w-full flex-col items-center justify-between shadow-md md:flex-row md:justify-between">
        <div
          id="GeneralNavBarContent"
          className="flex items-center space-x-4 md:mx-8 md:min-w-48 lg:mx-0">
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
            <div id="SiteInfoContainer" className="flex flex-col">
              <div className="text-2xl font-bold text-white">
                <span id="SiteName" className="text-green-400">
                  {siteConfig.name}
                </span>
              </div>
              <div id="SiteDescription" className="text-sm text-gray-400">
                Transaction Classifier
              </div>
            </div>
          </Link>
        </div>
        <div
          id="SessionNavBarContent"
          className={`w-full ${session?.user ? '' : 'hidden'} lg:mx-8 xl:mx-12`}>
          <UserSessionButtons stripePortalUrl={stripePortalUrl} />
        </div>
      </div>
      <div className="flex flex-col mb:w-full mb:flex-row mb:justify-evenly md:justify-evenly lg:gap-x-4">
        <div className={`mt-4 w-fit mb:mr-2 ${session?.user ? '' : 'hidden'}`}>
          <ChangeCompanyButton />
        </div>
        <div
          id="DeactivateCompany"
          className={`mt-4 w-fit mb:ml-2 ${session?.user ? '' : 'hidden'}`}>
          <DeactivationButton connectionStatus={connectionStatus} />
        </div>
      </div>
      {/* Display information only show if the user is logged in. */}
      {!session?.user && (
        <div className="mt-4 flex flex-col items-center justify-evenly gap-y-4 py-2 mb:flex-row mb:gap-x-6 sm:gap-x-8 md:mt-2 md:w-full md:pl-4 lg:pr-12 xl:pr-24">
          <a
            href="#how-it-works"
            className="w-48 rounded-lg bg-white bg-opacity-20 p-2 text-center text-lg font-semibold text-white hover:bg-opacity-40 mb:w-32 sm:w-40 lg:w-48">
            How It&nbsp;
            <span className="mb:block sm:inline-block">Works</span>
          </a>
          <a
            href="#why-quickbooks"
            className="w-48 rounded-lg bg-white bg-opacity-20 p-2 text-center text-lg font-semibold text-white hover:bg-opacity-40 mb:w-32 sm:w-40 lg:w-48">
            Why QuickBooks
          </a>
          <a
            href="#demo"
            className="w-48 rounded-lg bg-white bg-opacity-20 p-2 text-center text-lg font-semibold text-white hover:bg-opacity-40 mb:w-32 sm:w-40 lg:w-48">
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
    <div className="mt-4 flex w-full flex-col md:mt-0 md:w-full md:flex-row md:justify-center">
      <div className="mt-2 flex justify-evenly mb:mt-4 mb:gap-x-8 md:mt-1 md:w-full md:justify-evenly">
        <Button asChild id="ManageAccountButton" variant="link">
          <Link
            className="!mb-1 bg-gray-700 text-white hover:bg-gray-500 mb:max-w-44 md:!mb-0 md:p-6"
            href={stripePortalUrl}>
            <span className="font-bold mb:text-lg">Manage Account</span>
          </Link>
        </Button>
        <SignOutButton />
      </div>
    </div>
  );
};
