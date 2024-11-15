import { checkSubscription } from '@/actions/stripe';

import { checkCompanyConnection } from '@/actions/backend-actions/database-functions/index';

import { SBKConfirmationModal } from '@/components/modals/index';

import SubscriptionPurchase from '@/components/check-pages/subscription-purchase';

import ReviewPage from '@/components/review-elements/review-page';

import {
  getCompanyName,
  getCompanyIndustry,
  getCompanyLocation,
} from '@/actions/quickbooks/index';

import type { CompanyInfo } from '@/types';

export default async function Page() {
  // Get user subscription and check their status.
  const subscriptionStatus = await checkSubscription();
  // Check if the Synthetic BookKeeper is connected to the account.
  const companyHasSBK = await checkCompanyConnection();

  // Get the Company Info from the user info functions and record it as a Company Info object
  const userCompanyName = await getCompanyName();
  const userCompanyIndustry = await getCompanyIndustry();
  const userCompanyLocation = JSON.parse(await getCompanyLocation());
  const companyInfo: CompanyInfo = {
    name: userCompanyName,
    industry: userCompanyIndustry,
    location: userCompanyLocation,
  };

  if ('error' in subscriptionStatus || !subscriptionStatus.valid) {
    // If the user status is invalid or there is an error, go to the subscription purchase.
    return <SubscriptionPurchase />;
  } else if (
    !companyHasSBK.connected &&
    process.env.APP_CONFIG === 'production'
  ) {
    // Only perform check if in production mode.
    console.log(`${companyHasSBK.result}: ${companyHasSBK.message}`);
    return <SBKConfirmationModal />;
  } else {
    // Otherwise, show the review page.
    return (
      <div className="container mx-auto px-4 py-8">
        <ReviewPage companyInfo={companyInfo} />
      </div>
    );
  }
}
