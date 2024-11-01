import PricingTable from '@/components/site-elements/pricing-table';

export default async function SubscriptionPurchase() {
  let publicKey = '';
  if (process.env.APP_CONFIG === 'production') {
    publicKey = process.env.PROD_NEXT_PUBLIC_STRIPE_PUBLIC_KEY!;
  } else {
    publicKey = process.env.DEV_NEXT_PUBLIC_STRIPE_PUBLIC_KEY!;
  }

  let tableID = '';
  if (process.env.APP_CONFIG === 'production') {
    tableID = process.env.PROD_PRICING_TABLE_ID!;
  } else {
    tableID = process.env.DEV_PRICING_TABLE_ID!;
  }

  return (
    <div className="container flex h-full items-center justify-center">
      <div className="h-full w-[45%]">
        <PricingTable publicKey={publicKey} tableId={tableID} />
      </div>
      <div className="h-full w-[55%]">
        <div className="flex flex-col space-y-4">
          <h2
            id="ResultTitle"
            className="mb-4 text-center text-2xl font-bold text-red-500">
            No Subscription Detected...
          </h2>
          <p>
            The company you are signed in with does not have an active
            subscription. To access the home page and use all features, a
            subscription is required.
          </p>
          <p>
            Subscription options are shown on the left. You will be redirected
            to a Stripe transaction page to purchase the subscription.
          </p>
        </div>
      </div>
    </div>
  );
}
