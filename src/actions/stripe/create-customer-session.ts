'use server';
import { db } from '@/db/index';
import { User, Subscription } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import { Stripe } from 'stripe';

// Create a new Stripe object with the private key.
// Used to create a stripe Customer session.
const stripe = new Stripe(
  process.env.APP_CONFIG === 'production'
    ? (process.env.PROD_STRIPE_PRIVATE_KEY ?? '')
    : (process.env.DEV_STRIPE_PRIVATE_KEY ?? '')
);

// Use the current session to create a stripe session.
// Returns: An object with either the Customer session or an error.
export default async function createCustomerSession(): Promise<
  { customerSession: string } | { error: string }
> {
  try {
    // Get the current session.
    const session = await getServerSession(options);

    // If the current session does not have an email value, return an error.
    if (!session?.user?.email) {
      return { error: 'Error getting session' };
    }

    // Find the database User object using the session email.
    const user = await db
      .select()
      .from(User)
      .where(eq(User.email, session.user?.email));

    // If the fetched User does not exist, return an error.
    if (!user[0]?.id) {
      return { error: 'User not found!' };
    }

    // Find the related database Subscription object by the Id from the database User object.
    const userSubscription = await db
      .select()
      .from(Subscription)
      .where(eq(Subscription.userId, user[0].id));

    // If no matching Subscription object is found, return an error.
    if (!userSubscription[0]) {
      return { error: 'User subscription not found!' };
    }

    // Check if the database User object has a stripe Id value.
    const userStripeId = userSubscription[0]?.stripeId;
    if (userStripeId) {
      // Create a new Customer session with the User's stripe Id.
      // Session sets the pricing table component to enabled.
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
      // If the database User object does not have a stripe Id value, return an error response.
      return { error: 'User is missing a stripe customer Id' };
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
