'use server';
import { Stripe } from 'stripe';
import prisma from '@/lib/db';

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
  // Find the user with the passed user ID and include the subscription.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  if (!user?.subscription) {
    return Response.json({ error: 'User not found!' });
  }

  // Check for a user stripe ID.
  const userStripeId = user.subscription?.stripeId;

  // If the user doesn't have a stripe ID, create a new customer with the user's email and name.
  if (!userStripeId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.first_name} ${user.last_name}`,
    });

    // Update the user in the database with the new stripe ID in their subscription field.
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscription: {
          update: {
            stripeId: customer.id,
          },
        },
      },
    });

    // Return a response indicating the customer was created.
    return Response.json({ message: 'Customer created!' });
  } else {
    // If the user already has a stripe ID, return an error.
    return Response.json({ error: 'User already has stripe customerID!' });
  }
}
