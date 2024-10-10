import { checkSubscription } from '@/actions/stripe';
import SBKConfirmationModal from '@/components/halt-elements/sbk-confirmation-modal';
import SubscriptionPurchase from '@/components/halt-elements/subscription-purchase';
import HomePage from '@/components/home';

const functionToCheckIfSBKExists = (): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(false);
    }, 1000);
  });
};

export default async function Page() {

  // Get user subscription and check their status.
  const subscriptionStatus = await checkSubscription();
  // Check if the Synthetic BookKeeper is connected to the account.
  const companyHasSBK = await functionToCheckIfSBKExists();

  if ('error' in subscriptionStatus || !subscriptionStatus.valid) {
    // If the user status is invalid or there is an error, go to the subscription purchase.
    return <SubscriptionPurchase />;
  } else if (!companyHasSBK) {
    return <SBKConfirmationModal companyHasSBK={companyHasSBK}/>;
  } else {
    // Otherwise, show the home page.
    return <HomePage />;
  }
 }
