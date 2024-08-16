'use server';
import { Stripe } from 'stripe';
import { db } from '@/db/index';
import { Subscription, User } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Create a new Stripe object with the private key.
const stripe = new Stripe(
  process.env.APP_CONFIG === 'production'
    ? (process.env.PROD_STRIPE_PRIVATE_KEY ?? '')
    : (process.env.DEV_STRIPE_PRIVATE_KEY ?? '')
);

// Takes a user ID as a string.
export default async function createCustomerID(
  userId: string
): Promise<Response> {
  // Find the subscription whose user ID matches the passed value.
  const subscription = await db
    .select()
    .from(Subscription)
    .where(eq(Subscription.userId, userId));

  if (!subscription[0]) {
    return Response.json({ error: 'User not found!' });
  }

  // Check for a user stripe ID.
  const userStripeId = subscription[0]?.stripeId;

  // If the user doesn't have a stripe ID, create a new customer with the user's email and name.
  if (!userStripeId) {
    const user = await db.select().from(User).where(eq(User.id, userId));

    // If the user doesn't exist, return an error.
    if (!user[0]) {
      return Response.json({ error: 'User not found!' });
    }

    // Assert that the user has an email by use of the null return check above.
    const customer = await stripe.customers.create({
      email: user[0].email!,
      name: `${user[0].firstName} ${user[0].lastName}`,
    });

    // Create a subscription object connected to the user with the new stripe ID in their subscription field.
    await db.insert(Subscription).values({
      userId,
      stripeId: customer.id,
    });

    // Return a response indicating the customer was created.
    return Response.json({ message: 'Customer created!' });
  } else {
    // If the user already has a stripe ID, return an error.
    return Response.json({ error: 'User already has stripe customerID!' });
  }
}
