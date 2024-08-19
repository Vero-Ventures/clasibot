'use server';
import { Stripe } from 'stripe';
import { db } from '@/db/index';
import { User, Subscription } from '@/db/schema';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import { eq } from 'drizzle-orm';

// Create a new Stripe object with the private key.
const stripe = new Stripe(
  process.env.APP_CONFIG === 'production'
    ? (process.env.PROD_STRIPE_PRIVATE_KEY ?? '')
    : (process.env.DEV_STRIPE_PRIVATE_KEY ?? '')
);

export default async function createCustomerSession(): Promise<
  { customerSession: string } | { error: string }
> {
  // Get the current session.
  const session = await getServerSession(options);

  // If the session doesn't have a user email, return an error.
  if (!session?.user?.email) {
    return { error: 'Error getting session' };
  }

  // Get user using the session email to find the subscription.
  const user = await db
    .select()
    .from(User)
    .where(eq(User.email, session.user?.email));

  // If the user does not exist, return an error.
  if (!user[0]?.id) {
    return { error: 'User not found!' };
  }

  // Find the user's subscription in the database by their session id.
  const userSubscription = await db
    .select()
    .from(Subscription)
    .where(eq(Subscription.userId, user[0].id));

  // If not matching subscription is found, return an error.
  if (!userSubscription[0]) {
    return { error: 'User subscription not found!' };
  }

  // If the user has a stripe ID, create a new customer session with the user's stripe ID.
  const userStripeId = userSubscription[0]?.stripeId;
  if (userStripeId) {
    // Created session sets the pricing table component to enabled.
    const customerSession = await stripe.customerSessions.create({
      customer: userStripeId,
      components: {
        pricing_table: {
          enabled: true,
        },
      },
    });

    // Return the customer session and associated client secret.
    return {
      customerSession: customerSession.client_secret,
    };
  } else {
    // If the user doesn't have a stripe ID, return an error.
    return { error: 'User is missing a stripe customerID' };
  }
}
