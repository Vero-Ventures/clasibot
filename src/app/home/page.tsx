import { checkSubscription } from '@/actions/stripe';
import HomePage from '@/components/home';
import PricingTable from '@/components/site-elements/pricing-table';

export default async function Page() {
  // Define the public Stripe key and pricing table Id based on app config.
  let publicKey = '';
  let tableId = '';

  if (process.env.APP_CONFIG === 'production') {
    publicKey = process.env.PROD_STRIPE_PUBLIC_KEY!;
    tableId = process.env.PROD_PRICING_TABLE_ID!;
  } else {
    publicKey = process.env.DEV_STRIPE_PUBLIC_KEY!;
    tableId = process.env.DEV_PRICING_TABLE_ID!;
  }

  // Get User Subscription status.
  const subscriptionStatus = await checkSubscription();

  // Check in an invalid Subscription staus was returned (Not an error).
  if ('error' in subscriptionStatus || !subscriptionStatus.valid) {
    // For an unsubscribed User display the pricing table alongside the regular home page.
    // Pricing table displays above on smaller screens and to the left on larger screens.
    return (
      <div className="flex w-11/12 flex-grow flex-col lg:flex-row lg:gap-x-12">
        <div id="PricingTableContainer" className="w-full lg:w-4/12">
          <PricingTable publicKey={publicKey} tableId={tableId} />
        </div>
        <div id="HomePageContainer" className="w-full lg:w-8/12">
          <HomePage />
        </div>
      </div>
    );
  }
  // If a Subscription is present and valid, display the homepage as normal.
  return <HomePage />;
}
