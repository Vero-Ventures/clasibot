'use server';
import { Stripe } from 'stripe';
import { db } from '@/db/index';
import { User, Subscription, Company } from '@/db/schema';
import { getServerSession } from 'next-auth/next';
import { options } from '@/app/api/auth/[...nextauth]/options';
import { eq } from 'drizzle-orm';

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

  // Find the user's subscription in the database by the ID from the user.
  const userSubscription = await db
    .select()
    .from(Subscription)
    .where(eq(Subscription.userId, user[0].id));

  // If the user doesn't have a subscription, return an error.
  if (!userSubscription[0]?.stripeId) {
    return { error: 'User Subscription not found!' };
  }

  // Get the subscription status from Stripe using a list of customers with matching ID's.
  const subscription = await stripe.subscriptions.list({
    customer: userSubscription[0].stripeId,
  });

  // Check and return if the subscription is active and valid.
  const subStatus = subscription.data[0]?.status;

  return {
    status: subStatus || 'inactive',
    valid: subStatus === 'active' || subStatus === 'trialing',
  };
}

export async function checkSubscriptionByCompany(
  realmId: string
): Promise<{ status: string; valid: boolean } | { error: string }> {
  // Get the company related to the passed realm ID.
  const userCompany = await db
    .select()
    .from(Company)
    .where(eq(Company.realmId, realmId));

  // If the company cannot be found, return an error.
  if (!userCompany[0]) {
    return { error: 'Error getting company' };
  }

  // Get user using the companies related user ID value to find the subscription.
  const user = await db
    .select()
    .from(User)
    .where(eq(User.email, userCompany[0].userId));

  // If the user does not exist, return an error.
  if (!user[0]?.id) {
    return { error: 'User not found!' };
  }

  // Find the user's subscription in the database by the ID from the user.
  const userSubscription = await db
    .select()
    .from(Subscription)
    .where(eq(Subscription.userId, user[0].id));

  // If the user doesn't have a subscription, return an error.
  if (!userSubscription[0]?.stripeId) {
    return { error: 'User Subscription not found!' };
  }

  // Get the subscription status from Stripe using a list of customers with matching ID's.
  const subscription = await stripe.subscriptions.list({
    customer: userSubscription[0].stripeId,
  });

  // Check and return if the subscription is active and valid.
  const subStatus = subscription.data[0]?.status;

  return {
    status: subStatus || 'inactive',
    valid: subStatus === 'active' || subStatus === 'trialing',
  };
}
