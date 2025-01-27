import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { checkSubscription } from '@/actions/stripe';

import { checkCompanyConnection } from '@/actions/connection-functions/index';

import { ConnectionConfirmationModal } from '@/components/modals/index';

import SubscriptionPage from '@/components/check-pages/subscription-purchase';

import ReviewPage from '@/components/review-page/review-page';

import {
  getCompanyName,
  getCompanyIndustry,
  getCompanyLocation,
} from '@/actions/quickbooks/index';

import type { CompanyInfo } from '@/types';

export default async function Page() {
  const session = await getServerSession();
  if (!session) {
    redirect('/');
  }

  // Get user subscription and check their status.
  const subscriptionStatus = await checkSubscription();

  // Check if the Synthetic BookKeeper is connected to the Company.
  const companyHasSBK = await checkCompanyConnection();

  // Get the Company Info from the QuickBooks functions.
  const userCompanyName = await getCompanyName();
  const userCompanyIndustry = await getCompanyIndustry();
  const userCompanyLocation = JSON.parse(await getCompanyLocation());

  // Record the collected Company Info to be passed to the Review Page.
  const companyInfo: CompanyInfo = {
    name: userCompanyName,
    industry: userCompanyIndustry,
    location: userCompanyLocation,
  };

  // If the user status is invalid or there is an error, go to the subscription page.
  if (
    ('error' in subscriptionStatus || !subscriptionStatus.valid) &&
    process.env.APP_CONFIG === 'production'
  ) {
    return <SubscriptionPage />;
  } else if (
    !companyHasSBK.connected &&
    process.env.APP_CONFIG === 'production'
  ) {
    // Checks if the user is not Connected to the Synthetic Bookkeeper shows the Connection needed modal.
    return <ConnectionConfirmationModal />;
  } else {
    // If the user is subscribed and connected, show the Review Page.
    return (
      <div className="mx-auto w-full px-4 py-8 mb:px-6 sm:px-8 2xl:w-fit">
        <ReviewPage companyInfo={companyInfo} />
      </div>
    );
  }
}
