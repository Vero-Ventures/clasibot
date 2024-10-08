import { options } from '@/app/api/auth/[...nextauth]/options';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import Image from 'next/image';
import { checkSubscription } from '@/actions/stripe';
import { Button } from '@/components/ui/button';
import SignOutButton from '@/components/inputs/sign-out-button';
import ChangeCompanyButton from '@/components/inputs/change-company-button';
import { siteConfig } from '@/site-config/site';
import logo from '../../public/logo.svg';

const Navbar = async () => {
  // Define the session using the options, and get the server session.
  const session = await getServerSession(options);
  // Check the user's subscription status.
  const subscriptionStatus = await checkSubscription();

  // Define values to be used in the user session info elements.
  let userStatus;
  let statusColor;

  // If the subsciption status returned an error or if the valid state is false, set user status to inactive and text color to red.
  if ('error' in subscriptionStatus || !subscriptionStatus.valid) {
    statusColor = 'text-red-400';
    userStatus = 'Inactive';
  } else {
    // Otherwise, set the user status to active.
    statusColor = 'text-green-400';
    userStatus = 'Active';
  }

  // Get the users name and email.
  const userEmail = session?.user?.email ?? '';
  const name = session?.user?.name ?? '';

  // Define the Stripe portal URL using the user's email.
  const stripePortalUrl = `${process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL}?prefilled_email=${encodeURIComponent(userEmail)}`;

  return (
    <nav className="flex flex-col items-center justify-between bg-gray-900 px-6 py-4 shadow-md md:flex-row">
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
      {/* Display information only show if the user is logged in. */}
      {session?.user && (
        <>
          <div className="mb-4 mt-6">
            <ChangeCompanyButton />
          </div>
          {/* Display user session information: Name and Subscription Status. */}
          {/* Also contains the Manage Account Button, & Sign Out Button. */}
          <UserSessionInfo
            name={name}
            statusColor={statusColor}
            userStatus={userStatus}
            stripePortalUrl={stripePortalUrl}
          />
        </>
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

// Takes a name, user status, and stripe portal URL as arguments.
const UserSessionInfo: React.FC<UserSessionInfoProps> = ({
  name,
  userStatus,
  statusColor,
  stripePortalUrl,
}) => {
  return (
    <div className="flex flex-col items-center space-y-4 md:flex-row md:space-x-4 md:space-y-0">
      <div className="text-center text-white md:mb-0 md:mr-4 md:mt-2 md:text-left lg:mt-1 xl:mt-0">
        Welcome,
        <span className="block xl:hidden">{name}</span>
        <span className="hidden xl:inline"> {name}</span>
      </div>
      <div id="UserStatus" className="text-white">
        Status: <span className={`font-bold ${statusColor}`}>{userStatus}</span>
      </div>
      <Button asChild id="ManageAccountButton" variant="link">
        <Link
          className="!mb-1 bg-gray-700 text-white underline underline-offset-4 hover:bg-gray-500 md:!mb-0 md:!ml-6 lg:!ml-8"
          href={stripePortalUrl}>
          <span className="font-bold">Manage Account</span>
        </Link>
      </Button>
      <SignOutButton />
    </div>
  );
};

// Export the Navbar component.
export default Navbar;
