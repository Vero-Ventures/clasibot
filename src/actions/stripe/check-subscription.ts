'use server';

import { getServerSession } from 'next-auth/next';
import { options } from '@/app/api/auth/[...nextauth]/options';

import { db } from '@/db/index';
import { User, Subscription } from '@/db/schema';
import { eq } from 'drizzle-orm';

import { Stripe } from 'stripe';

// Create a Stripe object with the private key, used to check the User Subscription status.
const stripe = new Stripe(
  process.env.APP_CONFIG === 'production'
    ? (process.env.PROD_STRIPE_PRIVATE_KEY ?? '')
    : (process.env.DEV_STRIPE_PRIVATE_KEY ?? '')
);

// Returns: An object with a status string and a validity boolean or an error object.
export async function checkSubscription(): Promise<
  { status: string; valid: boolean } | { error: string }
> {
  try {
    // Get the current session.
    const session = await getServerSession(options);

    // If the current session does not have an Email value, return an error.
    if (!session?.user?.email) {
      return { error: 'Error getting session' };
    }

    // Get the User using the Email pulled from the session.
    const user = await db
      .select()
      .from(User)
      .where(eq(User.email, session.user?.email));

    // If the fetched User does not exist, return an error object.
    if (!user[0]?.id) {
      return { error: 'User not found!' };
    }

    // Find the User Subscription by matching the to the User Id value.
    const userSubscription = await db
      .select()
      .from(Subscription)
      .where(eq(Subscription.userId, user[0].id));

    // If the User does not have a Subscription, return an error.
    if (!userSubscription[0]?.stripeId) {
      return { error: 'User Subscription not found!' };
    }

    // Get the Subscription status from Stripe using the Stripe Id value in the Subscription.
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
