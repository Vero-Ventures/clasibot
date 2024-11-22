import { PricingTable } from '@/components/site-elements/index';

export default async function SubscriptionPurchase() {
  let publicKey = '';
  if (process.env.APP_CONFIG === 'production') {
    publicKey = process.env.DEV_STRIPE_PRIVATE_KEY!;
  } else {
    publicKey = process.env.DEV_STRIPE_PUBLIC_KEY!;
  }

  let tableID = '';
  if (process.env.APP_CONFIG === 'production') {
    tableID = process.env.PROD_PRICING_TABLE_ID!;
  } else {
    tableID = process.env.DEV_PRICING_TABLE_ID!;
  }

  return (
    <div className="container md:pb-[5%] lg:pb-[0%]">
      <div className="flex transform flex-col justify-between lg:flex-row lg:content-center xl:justify-evenly">
        <div className="content-center rounded-lg border-4 border-red-300 border-opacity-60 bg-white p-6 py-4 shadow-lg transition-transform duration-500 hover:scale-105 hover:shadow-2xl md:pb-4 lg:w-[55%] xl:w-[40%]">
          <div className="flex flex-col space-y-4 pt-8 lg:pt-0">
            <h2 className="mb-4 text-center text-3xl font-bold md:text-4xl">
              Your account does not have a valid subscription.
            </h2>
            <div className="space-y-2">
              <p className="text-center md:text-xl">
                A subscription is required before reviewing your transactions.
              </p>

              <p className="text-center md:text-xl"></p>

              <p className="text-center md:text-xl">
                Please ensure your subscription is active or begin your free one
                month trial. After your subscription or trial is activated, you
                will be redirected to the review page.
              </p>
            </div>
          </div>
          <div>
            <h2 className="mb-2 mt-8 text-center text-xl font-bold md:text-2xl">
              Select between a monthly and yearly subscription&nbsp;
              <span className="lg:hidden">below.</span>
              <span className="hidden lg:inline-block">to the right.</span>
            </h2>
          </div>
        </div>
        <div className="justify-center lg:w-[45%] xl:w-[40%]">
          <PricingTable publicKey={publicKey} tableId={tableID} />
        </div>
      </div>
    </div>
  );
}
