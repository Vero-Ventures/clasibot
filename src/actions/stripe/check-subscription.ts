'use server';
import { Stripe } from 'stripe';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { options } from '@/app/api/auth/[...nextauth]/options';

// Create a new Stripe object with the private key.
const stripe = new Stripe(
  process.env.APP_CONFIG === 'production'
    ? (process.env.PROD_STRIPE_PRIVATE_KEY ?? '')
    : (process.env.DEV_STRIPE_PRIVATE_KEY ?? '')
);

export default async function checkSubscription(): Promise<
  { status: string; valid: boolean } | { error: string }
> {
  // Get the current session.
  const session = await getServerSession(options);

  if (!session?.userId) {
    return { error: 'Error getting session' };
  }

  // Find the user's subscription in the database.
  const userSubscription = await prisma.subscription.findFirst({
    where: { userId: session.userId },
  });

  if (!userSubscription?.stripeId) {
    return { error: 'User Subscription not found!' };
  }

  // Get the subscription status from Stripe using a list of customers with matching ID's.
  const subscription = await stripe.subscriptions.list({
    customer: userSubscription.stripeId,
  });

  const subStatus = subscription.data[0]?.status;

  // Return if  the subscription is active and valid.
  return {
    status: subStatus || 'inactive',
    valid: subStatus === 'active' || subStatus === 'trialing',
  };
}
