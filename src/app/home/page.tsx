/**
 * Defines a layout that wraps the homepage to connect the pricing table components.
 * If the user has a valid subscription, the home page is unchanged.
 */
import { checkSubscription } from '@/actions/stripe';
import HomePage from '@/components/home';
import PricingTable from '@/components/site-elements/pricing-table';

export default async function Page() {
  // Check if the user has a valid subscription
  const subscriptionStatus = await checkSubscription();
  if ('error' in subscriptionStatus || !subscriptionStatus.valid) {
    // If the user status is invalid or there is an error, display the pricing table.
    return (
      <div className="flex flex-col px-4 lg:flex-row">
        {/* Display the pricing table above the homepage. Move to left on larger screens*/}
        <div className="w-full lg:w-4/12">
          <PricingTable />
        </div>
        {/* Display the homepage content below the pricing table. Move to right on larger screens */}
        <div className="w-full lg:w-8/12">
          <HomePage />
        </div>
      </div>
    );
  }

  // If the user has a valid subscription, display the homepage without the pricing table.
  return <HomePage />;
}
