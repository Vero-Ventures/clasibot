'use server';
import { db } from '@/db/index';
import { User, Subscription } from '@/db/schema';
import { classificationCompanyIteration } from './company-iteration';
import { Stripe } from 'stripe';

// Create a new Stripe object with the private key.
// Used to check the users subscription status.
const stripe = new Stripe(
  process.env.APP_CONFIG === 'production'
    ? (process.env.PROD_STRIPE_PRIVATE_KEY ?? '')
    : (process.env.DEV_STRIPE_PRIVATE_KEY ?? '')
);

// Iterates through the users to check if they have a valid subscription before passing them down to the company selection handler.
// Does not return any value, with sub-calls logging error QueryResults as the users are proccessed.
export async function classificationUserIteration() {
  try {
    // Get all of the users and Subscriptions in the database.
    const users = await db.select().from(User);
    const subscriptions = await db.select().from(Subscription);

    // Iterate over the Users and check if they have a valid Subscription.
    for (const currentUser of users) {
      // Look for a subscription object connected to the user by the User Id.
      const userSubscription = subscriptions.find(
        (subscription) => subscription.userId === currentUser.id
      );

      // If a subscription is found and it has an assosiated stripe Id, check the users subscription status.
      if (userSubscription?.stripeId) {
        // Get the subscription data from stripe and extract the status field.
        const subData = await stripe.subscriptions.list({
          customer: userSubscription.stripeId,
        });
        const subStatus = subData.data[0]?.status;

        // If the subscription status is valid, pass the user to the company selection action.
        // Handles the classification process for all of the users companies.
        if (subStatus === 'active' || subStatus === 'trialing') {
          classificationCompanyIteration(currentUser);
        }
      }
      // Continue to the next user.
    }
  } catch (error) {
    // Catch any errors and log them in QueryResult format. Set detail to error message if present.
    if (error instanceof Error) {
      console.error({
        result: 'Error',
        message:
          'Weekly Classification: Error Caught When Iterating Through QuickBooks Users.',
        detail: error.message,
      });
    } else {
      console.error({
        result: 'Error',
        message:
          'Weekly Classification: Error Caught When Iterating Through QuickBooks Users.',
        detail: 'Unexpected Error',
      });
    }
  }
}