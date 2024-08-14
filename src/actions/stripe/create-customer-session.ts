'use server';
import { Stripe } from 'stripe';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

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
  const userId = (await getServerSession(options))?.userId;

  if (!userId) {
    return { error: 'User not found!' };
  }

  // Find the user's subscription in the database, provided they have a subscription.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  if (!user?.subscription) {
    return { error: 'User not found!' };
  }

  const userStripeId = user.subscription?.stripeId;
  // If the user has a stripe ID, create a new customer session with the user's stripe ID.
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
