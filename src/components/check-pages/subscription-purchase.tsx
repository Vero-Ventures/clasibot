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
      <div className="flex flex-col justify-between lg:flex-row xl:justify-evenly">
        <div className="content-center md:pb-4 lg:w-[55%] xl:w-[40%]">
          <div className="flex flex-col space-y-4 pt-8 lg:pt-0">
            <h2 className="mb-4 text-center text-2xl font-bold text-red-500 md:text-3xl">
              Your account does not have a valid subscription.
            </h2>
            <div className="space-y-2">
              <p className="text-center md:text-xl">
                <span className="block md:inline-block">
                  Before accessing the&nbsp;
                  <span className="block mb:inline-block">
                    Clasibot Transaction Classifier,&nbsp;
                  </span>
                </span>
                <span className="block md:inline-block">
                  <span className="block mb:inline-block">
                    please setup a subscription or&nbsp;
                  </span>
                  <span className="block mb:inline-block">
                    begin your free one month trial.
                  </span>
                </span>
              </p>
              <p className="text-center md:text-xl">
                Once you have an active&nbsp;
                <span className="block mb:inline-block">
                  subscription or trial,&nbsp;
                </span>
                <span className="block sm:inline-block">
                  you will be redirected to the homepage.
                </span>
              </p>
            </div>
          </div>
          <div>
            <h2 className="mb-2 mt-8 text-center text-xl font-bold md:text-2xl">
              View the monthly and yearly&nbsp;
              <span className="block mb:inline-block">
                subscription options&nbsp;
              </span>
              <span className="block mb:inline-block lg:hidden">
                in the table below.
              </span>
              <span className="hidden lg:inline-block">
                in the table to the right.
              </span>
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
