'use server';

import { db } from '@/db/index';
import { User, Subscription, Company } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth/next';
import { options } from '@/app/api/auth/[...nextauth]/options';
import { Stripe } from 'stripe';

// Create a new Stripe object with the private key.
// Used to check the users subscription status.
const stripe = new Stripe(
  process.env.APP_CONFIG === 'production'
    ? (process.env.PROD_STRIPE_PRIVATE_KEY ?? '')
    : (process.env.DEV_STRIPE_PRIVATE_KEY ?? '')
);

// Check the subscription status of the current user using the session.
// May take a realmId instead to support backend functions.
// Returns: An object with a status string and a validity boolean or an error object with a string value.
export default async function checkSubscription(
  realmId: string | null = null
): Promise<{ status: string; valid: boolean } | { error: string }> {
  try {
    // Define the user variable to be retrived by different methods depending on frontend or backend.
    let user;

    // Check if a realm Id was passed and find the user using backend method.
    if (realmId) {
      // Get the company related to the passed realm ID.
      const userCompany = await db
        .select()
        .from(Company)
        .where(eq(Company.realmId, realmId));

      // If the company cannot be found, return an error.
      if (!userCompany[0]) {
        return { error: 'Error getting company' };
      }

      // Get the user from the database using the related user Id value from the company.
      user = await db
        .select()
        .from(User)
        .where(eq(User.email, userCompany[0].userId));

      // If no realm Id was passed, find the user using frontend method
    } else {
      // Get the current session.
      const session = await getServerSession(options);

      // If the current session does not have a user email, return an error.
      if (!session?.user?.email) {
        return { error: 'Error getting session' };
      }

      // Get the user from the database using the session email.
      user = await db
        .select()
        .from(User)
        .where(eq(User.email, session.user?.email));
    }

    // If the fetched user does not exist, return an error.
    if (!user[0]?.id) {
      return { error: 'User not found!' };
    }

    // Find the user's subscription object in the database by the Id from the database user object.
    const userSubscription = await db
      .select()
      .from(Subscription)
      .where(eq(Subscription.userId, user[0].id));

    // If the user doesn't have a subscription, return an error.
    if (!userSubscription[0]?.stripeId) {
      return { error: 'User Subscription not found!' };
    }

    // Get the subscription status from Stripe using the stripeId value of the user subscription object.
    const subscription = await stripe.subscriptions.list({
      customer: userSubscription[0].stripeId,
    });

    // Check and return if the subscription is active and valid.
    const subStatus = subscription.data[0]?.status;
    return {
      status: subStatus || 'inactive',
      valid: subStatus === 'active' || subStatus === 'trialing',
    };
  } catch {
    // Catch any errors and return an inactive and invalid status.
    return {
      status: 'inactive',
      valid: false,
    };
  }
}
