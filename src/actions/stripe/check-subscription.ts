'use server';
import { getServerSession } from 'next-auth/next';
import { options } from '@/app/api/auth/[...nextauth]/options';
import { db } from '@/db/index';
import { User, Subscription, Company } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Stripe } from 'stripe';

// Create a new Stripe object with the private key.
// Used to check the User Subscription status.
const stripe = new Stripe(
  process.env.APP_CONFIG === 'production'
    ? (process.env.PROD_STRIPE_PRIVATE_KEY ?? '')
    : (process.env.DEV_STRIPE_PRIVATE_KEY ?? '')
);

// Check the Subscription status of the current User using the session.
// May take an optional realmId to support backend functions.
// Returns: An object with a status string and a validity boolean or an error object with a string value.
export default async function checkSubscription(
  realmId: string | null = null
): Promise<{ status: string; valid: boolean } | { error: string }> {
  try {
    // Define the User variable to be retrived by frontend or backend check.
    let user;

    // Check if a realm Id was passed and find the User using backend method.
    if (realmId) {
      // Get the database company using the passed realm ID.
      const userCompany = await db
        .select()
        .from(Company)
        .where(eq(Company.realmId, realmId));

      // If a company cannot be found, return an error object.
      if (!userCompany[0]) {
        return { error: 'Error getting company' };
      }

      // Get the User from the database by the related User Id value in the fetched company.
      user = await db
        .select()
        .from(User)
        .where(eq(User.email, userCompany[0].userId));

      // If no realm Id was passed, find the User using frontend method
    } else {
      // Get the current session.
      const session = await getServerSession(options);

      // If the current session does not have an email value, return an error.
      if (!session?.user?.email) {
        return { error: 'Error getting session' };
      }

      // Get the User from the database using the email pulled from the session.
      user = await db
        .select()
        .from(User)
        .where(eq(User.email, session.user?.email));
    }

    // If the fetched database User object does not exist, return an error.
    if (!user[0]?.id) {
      return { error: 'User not found!' };
    }

    // Find the User's Subscription object by matching the to the User Id value.
    const userSubscription = await db
      .select()
      .from(Subscription)
      .where(eq(Subscription.userId, user[0].id));

    // If the User does not have a Subscription, return an error.
    if (!userSubscription[0]?.stripeId) {
      return { error: 'User Subscription not found!' };
    }

    // Get the subscription status from Stripe using the stripeId value in the Subscription object.
    const subscription = await stripe.subscriptions.list({
      customer: userSubscription[0].stripeId,
    });

    // Get and return the Subscription status along with a boolean value indicating if it is active.
    const subStatus = subscription.data[0]?.status;
    return {
      status: subStatus || 'inactive',
      valid: subStatus === 'active' || subStatus === 'trialing',
    };
  } catch {
    // Catch any errors and return inactive and invalid status values.
    return {
      status: 'inactive',
      valid: false,
    };
  }
}
