'use server';

import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

import { db } from '@/db/index';
import { User, Subscription } from '@/db/schema';
import { eq } from 'drizzle-orm';

import { Stripe } from 'stripe';

// Create a Stripe object with the private key, used to create a Stripe Customer session.
const stripe = new Stripe(
  process.env.APP_CONFIG === 'production'
    ? (process.env.PROD_STRIPE_PRIVATE_KEY ?? '')
    : (process.env.DEV_STRIPE_PRIVATE_KEY ?? '')
);

// Returns: Either the Customer session or an error object.
export async function createCustomerSession(): Promise<
  { customerSession: string } | { error: string }
> {
  try {
    // Get the current session.
    const session = await getServerSession(options);

    // If the current session does not have an Email value, return an error.
    if (!session?.user?.email) {
      return { error: 'Error getting session' };
    }

    // Find the User using the session Email.
    const user = await db
      .select()
      .from(User)
      .where(eq(User.email, session.user?.email));

    // If the fetched User does not exist, return an error.
    if (!user[0]?.id) {
      return { error: 'User not found!' };
    }

    // Find the related Subscription by the Id from the User.
    const userSubscription = await db
      .select()
      .from(Subscription)
      .where(eq(Subscription.userId, user[0].id));

    // If no matching Subscription is found, return an error.
    if (!userSubscription[0]) {
      return { error: 'User Subscription not found!' };
    }

    // Check if the User has a Stripe Id value.
    const userStripeId = userSubscription[0]?.stripeId;
    if (userStripeId) {
      // Create a new Customer session with the User Stripe Id.
      // Session sets the Pricing Table component to enabled.
      const customerSession = await stripe.customerSessions.create({
        customer: userStripeId,
        components: {
          pricing_table: {
            enabled: true,
          },
        },
      });

      // Return the client secret as the Customer session.
      return {
        customerSession: customerSession.client_secret,
      };
    } else {
      // If the User does not have a Stripe Id value, return an error response.
      return { error: 'User is missing a Stripe Customer Id' };
    }
  } catch (error) {
    // Catch any errors and return an error response, include the error message if it is present.
    if (error instanceof Error) {
      return { error: error.message };
    } else {
      return { error: 'Unexpected Error.' };
    }
  }
}
