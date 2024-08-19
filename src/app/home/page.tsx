import { checkSubscription } from '@/actions/stripe';
import HomePage from '@/components/home';
import PricingTable from '@/components/site-elements/pricing-table';

export default async function Page() {
  // Get user subscription and check their status.
  const subscriptionStatus = await checkSubscription();

  // Define the public stripe key to pass to the pricing table.
  let publicKey = '';
  if (process.env.APP_CONFIG === 'production') {
    publicKey = process.env.PROD_NEXT_PUBLIC_STRIPE_PUBLIC_KEY!;
  } else {
    publicKey = process.env.DEV_NEXT_PUBLIC_STRIPE_PUBLIC_KEY!;
  }

  if ('error' in subscriptionStatus || !subscriptionStatus.valid) {
    // If the user status is invalid or there is an error, display the pricing table.
    // Pricing table displays above the homepage on smaller screens and to the left on larger screens.
    return (
      <div className="flex-collg:flex-row flex w-11/12 flex-grow lg:gap-x-12">
        <div id="PricingTableContainer" className="w-full lg:w-4/12">
          <PricingTable publicKey={publicKey} />
        </div>
        <div id="HomePageContainer" className="w-full lg:w-8/12">
          <HomePage />
        </div>
      </div>
    );
  }
  // Otherwise, display the homepage.
  return <HomePage />;
}
