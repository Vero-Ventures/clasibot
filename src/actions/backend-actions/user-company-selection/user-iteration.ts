'use server';
import { db } from '@/db/index';
import { User, Subscription } from '@/db/schema';
import { Stripe } from 'stripe';
import { classificationCompanyIteration } from './company-iteration';

// Create a new Stripe object with the private key.
// Used to check the User Subscription status.
const stripe = new Stripe(
  process.env.APP_CONFIG === 'production'
    ? (process.env.PROD_STRIPE_PRIVATE_KEY ?? '')
    : (process.env.DEV_STRIPE_PRIVATE_KEY ?? '')
);

// Iterates through the User objects to check Subscription and call for Classificaion of their Companies.
// Async and concurrent method uses error loggin instead of returning values.
export async function classificationUserIteration() {
  try {
    // Get all of the User and Subscription objects in the database.
    const users = await db.select().from(User);
    const subscriptions = await db.select().from(Subscription);

    // Iterate over the User objects and check if they have a valid Subscription.
    for (const currentUser of users) {
      // Look for a Stripe Subscription object connected to the User by the User Id.
      const userSubscription = subscriptions.find(
        (subscription) => subscription.userId === currentUser.id
      );

      // If a Subscription is found and it has an assosiated Stripe Id, check the Subscription status.
      if (userSubscription?.stripeId) {
        // Get the Subscription data from Stripe and extract the status field.
        const subData = await stripe.subscriptions.list({
          customer: userSubscription.stripeId,
        });
        const subStatus = subData.data[0]?.status;

        // If the Subscription status is valid, pass the User to the Company iteration handler.
        // Handles the Classification process for all of the User Companies.
        if (subStatus === 'active' || subStatus === 'trialing') {
          classificationCompanyIteration(currentUser);
        }
      }
      // Continue to the next User.
    }
  } catch (error) {
    // Catch any errors and return an error Query Result, include the error message if it is present.
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
