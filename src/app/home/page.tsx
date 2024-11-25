import { getServerSession } from 'next-auth';

import { redirect } from 'next/navigation';

// import { checkSubscription } from '@/actions/stripe';

// import { checkCompanyConnection } from '@/actions/backend-actions/database-functions/index';

// import { SBKConfirmationModal } from '@/components/modals/index';

// import SubscriptionPurchase from '@/components/check-pages/subscription-purchase';

// import ReviewPage from '@/components/review-page/review-page';

// import {
//   getCompanyName,
//   getCompanyIndustry,
//   getCompanyLocation,
// } from '@/actions/quickbooks/index';

// import type { CompanyInfo } from '@/types';

export default async function Page() {

  const session = await getServerSession();
  if (!session) {
    redirect('/');
  }

  // Get user subscription and check their status.
  // const subscriptionStatus = await checkSubscription();
  // Check if the Synthetic BookKeeper is connected to the account.
  // const companyHasSBK = await checkCompanyConnection();

  // Get the Company Info from the QuickBooks functions.
  // const userCompanyName = await getCompanyName();
  // const userCompanyIndustry = await getCompanyIndustry();
  // const userCompanyLocation = JSON.parse(await getCompanyLocation());

  // Record the collected Company Info as an object to be passed to the review page.
  // const companyInfo: CompanyInfo = {
  //   name: 'Error: Name not found',
  //   industry: 'Error',
  //   location: { Country: '', SubLocation: null },
  // };

  // Otherwise, show the review page.
  return (
    <div className="container mx-auto px-4 py-8">
      <p>home</p>
      {/* <ReviewPage companyInfo={companyInfo} /> */}
    </div>
  );
}
