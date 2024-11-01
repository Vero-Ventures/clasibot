import { checkSubscription } from '@/actions/stripe';
import { checkCompanyConnection } from '@/actions/user-company/check-db-company';
import SBKConfirmationModal from '@/components/halt-elements/sbk-confirmation-modal';
import SubscriptionPurchase from '@/components/halt-elements/subscription-purchase';
import HomePage from '@/components/home';

export default async function Page() {
  // Get user subscription and check their status.
  const subscriptionStatus = await checkSubscription();
  // Check if the Synthetic BookKeeper is connected to the account.
  const companyHasSBK = await checkCompanyConnection();

  if ('error' in subscriptionStatus || !subscriptionStatus.valid) {
    // If the user status is invalid or there is an error, go to the subscription purchase.
    return <SubscriptionPurchase />;
  } else if (!companyHasSBK.connected) {
    console.log(`${companyHasSBK.result}: ${companyHasSBK.message}`);
    return <SBKConfirmationModal />;
  } else {
    // Otherwise, show the home page.
    return <HomePage />;
  }
}
