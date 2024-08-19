import { checkSubscription } from '@/actions/stripe';
import HomePage from '@/components/home';
import PricingTable from '@/components/site-elements/pricing-table';

export default async function Page() {
  // Get user subscription and check their status.
  const subscriptionStatus = await checkSubscription();

  if ('error' in subscriptionStatus || !subscriptionStatus.valid) {
    // If the user status is invalid or there is an error, display the pricing table.
    // Pricing table displays above the homepage on smaller screens and to the left on larger screens.
    return (
      <div className="flex flex-grow flex-collg:flex-row lg:gap-x-12 w-11/12">
        <div id="PricingTableContainer" className="w-full lg:w-4/12">
          <PricingTable />
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
