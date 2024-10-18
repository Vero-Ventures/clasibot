import { checkSubscription } from '@/actions/stripe';
import HomePage from '@/components/home';
import PricingTable from '@/components/site-elements/pricing-table';

export default async function Page() {
  // Get user subscription and check their status.
  const subscriptionStatus = await checkSubscription();

  // Define the public stripe key and pricing table Id based on app config.
  let publicKey = '';
  let tableID = '';

  if (process.env.APP_CONFIG === 'production') {
    publicKey = process.env.PROD_STRIPE_PUBLIC_KEY!;
    tableID = process.env.PROD_PRICING_TABLE_ID!;
  } else {
    publicKey = process.env.DEV_STRIPE_PUBLIC_KEY!;
    tableID = process.env.DEV_PRICING_TABLE_ID!;
  }

  // If the subscription staus is not an error, but is also invalid, display the pricing table alongside the regular home page.
  if ('error' in subscriptionStatus || !subscriptionStatus.valid) {
    // Pricing table displays above the homepage on smaller screens and to the left on larger screens.
    return (
      <div className="flex w-11/12 flex-grow flex-col lg:flex-row lg:gap-x-12">
        <div id="PricingTableContainer" className="w-full lg:w-4/12">
          <PricingTable publicKey={publicKey} tableID={tableID} />
        </div>
        <div id="HomePageContainer" className="w-full lg:w-8/12">
          <HomePage />
        </div>
      </div>
    );
  }
  // If the subscription is present and valid, display the homepage as normal.
  return <HomePage />;
}
