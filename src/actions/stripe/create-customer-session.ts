'use server';
import { db } from '@/db/index';
import { User, Subscription } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import { Stripe } from 'stripe';

// Create a new Stripe object with the private key.
// Used to create a stripe customer session.
const stripe = new Stripe(
  process.env.APP_CONFIG === 'production'
    ? (process.env.PROD_STRIPE_PRIVATE_KEY ?? '')
    : (process.env.DEV_STRIPE_PRIVATE_KEY ?? '')
);

// Use the current session to create a stripe sessiona and returns an object with either the customer session or an error.
export default async function createCustomerSession(): Promise<
  { customerSession: string } | { error: string }
> {
  try {
    // Get the current session.
    const session = await getServerSession(options);

    // If the session does not have a user email, return an error.
    if (!session?.user?.email) {
      return { error: 'Error getting session' };
    }

    // Find the user database object using the session email.
    const user = await db
      .select()
      .from(User)
      .where(eq(User.email, session.user?.email));

    // If the fetched user does not exist, return an error.
    if (!user[0]?.id) {
      return { error: 'User not found!' };
    }

    // Find the user's subscription object in the database by through their Id from the user database object.
    const userSubscription = await db
      .select()
      .from(Subscription)
      .where(eq(Subscription.userId, user[0].id));

    // If no matching subscription object is found, return an error.
    if (!userSubscription[0]) {
      return { error: 'User subscription not found!' };
    }

    // If the user database object has a stripe Id value, create a new customer session with the user's stripe Id.
    const userStripeId = userSubscription[0]?.stripeId;
    if (userStripeId) {
      // Create a session that sets the pricing table component to enabled.
      const customerSession = await stripe.customerSessions.create({
        customer: userStripeId,
        components: {
          pricing_table: {
            enabled: true,
          },
        },
      });

      // Return the client secret as the customer session.
      return {
        customerSession: customerSession.client_secret,
      };
    } else {
      // If the user database object does not have a stripe Id value, return an error response.
      return { error: 'User is missing a stripe customer Id' };
    }
  } catch (error) {
    // Catch any errors and return an error response with the error message if it is present.
    if (error instanceof Error) {
      return { error: error.message };
    } else {
      return { error: 'Unexpected Error.' };
    }
  }
}
