import { checkSubscription } from '@/actions/stripe';
import SBKConfirmationModal from '@/components/halt-elements/sbk-confirmation-modal';
import SubscriptionPurchase from '@/components/halt-elements/subscription-purchase';
import HomePage from '@/components/home';

// Represents a function that queries the database to confirm if the SBK has access to this company, returns a boolean.
const functionToCheckIfSBKExists = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 1000);
  });
};

// const functionToCheckIfCompanyExists = () => {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       resolve(true);
//     }, 1000);
//   });
// }

export default async function Page() {
  // const companyExists = await functionToCheckIfCompanyExists();
  // Get user subscription and check their status.
  const subscriptionStatus = await checkSubscription();
  const companyHasSBK = await functionToCheckIfSBKExists();

  if ('error' in subscriptionStatus || !subscriptionStatus.valid) {
    // If the user status is invalid or there is an error, go to the subscription purchase.
    return <SubscriptionPurchase />;
  } else if (!companyHasSBK) {
    // If the SBK is not associated with this company, show the modal.
    return <SBKConfirmationModal />;
  } else {
    // Otherwise, show the home page.
    return <HomePage />;
  }
 }
