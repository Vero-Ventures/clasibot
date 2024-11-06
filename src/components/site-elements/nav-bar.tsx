import { options } from '@/app/api/auth/[...nextauth]/options';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import Image from 'next/image';
import { checkSubscription } from '@/actions/stripe';
import { siteConfig } from '@/site-config/site';
import logo from '@/public/logo.svg';
import { Button } from '@/components/ui/button';
import SignOutButton from '@/components/inputs/sign-out-button';
import ChangeCompanyButton from '@/components/inputs/change-company-button';
import DeactivationButton from '@/components/site-elements/deactivation-button';

const Navbar = async () => {
  // Check the user's Subscription status.
  const subscriptionStatus = await checkSubscription();

  // Define values to be used in the user Session info elements.
  let userStatus;
  let statusColor;

  // Check if the subsciption status returned an error or if the valid state is false.
  if ('error' in subscriptionStatus || !subscriptionStatus.valid) {
    // Set user status to inactive and text color to red.
    statusColor = 'text-red-400';
    userStatus = 'Inactive';
  } else {
    // Otherwise, set the user status to active.
    statusColor = 'text-green-400';
    userStatus = 'Active';
  }

  // Get get the server session and extract the user name and email.
  const session = await getServerSession(options);
  const name = session?.user?.name ?? '';
  const userEmail = session?.user?.email ?? '';

  // Define the Stripe portal URL using the user's email. Takes user to a profile management page.
  const stripePortalUrl = `${process.env.STRIPE_CUSTOMER_PORTAL}?prefilled_email=${encodeURIComponent(userEmail)}`;

  return (
    <nav className="flex flex-col items-center justify-between bg-gray-900 px-6 py-4 shadow-md lg:px-[10%]">
      <div className="flex flex-col items-center justify-between shadow-md mb:w-full mb:flex-row mb:justify-evenly md:justify-between md:px-12">
        <div id="GeneralNavBarContent" className="flex items-center space-x-4">
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
        <div className={`mb-2 mt-6 w-fit ${session?.user ? '' : 'hidden'}`}>
          <ChangeCompanyButton />
        </div>
      </div>
      <div id="SessionNavBarContent" className="w-full">
        {/* Display user session information: Name and Subscription Status. */}
        {/* Also contains the Manage Account & Sign Out Buttons. */}
        <div className={`${session?.user ? '' : 'hidden'}`}>
          <UserSessionInfo
            name={name}
            statusColor={statusColor}
            userStatus={userStatus}
            stripePortalUrl={stripePortalUrl}
          />
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
};

// Define interface for data used in the user session info elements.
interface UserSessionInfoProps {
  name: string;
  userStatus: string;
  statusColor: string;
  stripePortalUrl: string;
}

// Takes a name, user status, and Stripe portal URL as arguments.
const UserSessionInfo: React.FC<UserSessionInfoProps> = ({
  name,
  userStatus,
  statusColor,
  stripePortalUrl,
}) => {
  return (
    <div className="flex flex-col md:flex-row">
      <div className="flex flex-col items-center space-y-4 mb:my-2 mb:w-full mb:flex-row mb:justify-evenly mb:space-y-0 md:justify-start">
        <div
          id="UserName"
          className="text-center text-white mb:mx-4 mb:ml-6 mb:w-48 md:ml-4 md:w-fit md:min-w-28 lg:text-lg xl:text-xl">
          Welcome,
          <span className="block xl:hidden">{name}</span>
          <span className="hidden xl:inline"> {name}</span>
        </div>
        <div
          id="UserStatus"
          className="flex items-center space-x-3 rounded-lg py-2 text-white shadow-md mb:pr-2 md:ml-4 md:mr-auto lg:ml-8"
          role="status"
          aria-live="polite">
          <div className="flex items-center space-x-1 md:mr-2">
            <span className="text-sm font-medium">Status:</span>
            <span className={`font-bold ${statusColor} text-lg`}>
              {userStatus}
            </span>
          </div>
          <DeactivationButton status={userStatus} />
        </div>
      </div>
      <div className="mt-2 flex justify-evenly mb:mt-4 md:mx-4 md:translate-x-2 md:space-x-4 lg:mx-4 lg:-translate-x-8 xl:-translate-x-14">
        <Button asChild id="ManageAccountButton" variant="link">
          <Link
            className="!mb-1 bg-gray-700 text-white hover:bg-gray-500 md:!mb-0"
            href={stripePortalUrl}>
            <span className="font-bold">Manage Account</span>
          </Link>
        </Button>
        <SignOutButton />
      </div>
    </div>
  );
};

// Export the Navbar component.
export default Navbar;
