'use server';
import { db } from '@/db/index';
import { Subscription, User } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Stripe } from 'stripe';

// Create a new Stripe object with the private key.
// Used to create a stripe user.
const stripe = new Stripe(
  process.env.APP_CONFIG === 'production'
    ? (process.env.PROD_STRIPE_PRIVATE_KEY ?? '')
    : (process.env.DEV_STRIPE_PRIVATE_KEY ?? '')
);

// Takes a user ID as a string to create a customer Id if possible and provides a response object.
export default async function createCustomerID(
  userId: string
): Promise<Response> {
  try {
    // Find the database subscription object whose user Id matches the passed value.
    const subscription = await db
      .select()
      .from(Subscription)
      .where(eq(Subscription.userId, userId));

    // If no subscription was found, return an error.
    if (!subscription[0]) {
      return Response.json({ error: 'User not found!' });
    }

    // Check for a user stripe ID in the subscription object.
    const userStripeId = subscription[0]?.stripeId;

    // If the subscription did not have a stripe ID, create a new customer with the user's email and name.
    if (!userStripeId) {
      // Get the user object from the database using the passed user Id.
      const user = await db.select().from(User).where(eq(User.id, userId));

      // If the fetched user does not exist, return an error.
      if (!user[0]) {
        return Response.json({ error: 'User not found!' });
      }

      // Create a customer object with a email and name pulled from the user database object.
      // Asserts a non-null email through the null return check above.
      const customer = await stripe.customers.create({
        email: user[0].email!,
        name: user[0].userName!,
      });

      // Update the subscription database object connected to the user with the new stripe ID.
      await db
        .update(Subscription)
        .set({
          stripeId: customer.id,
        })
        .where(eq(Subscription.userId, user[0].id));

      // Return a response indicating the customer was created.
      return Response.json({ message: 'Customer created!' });
    } else {
      // If the user already has a stripe ID, return an error.
      return Response.json({ error: 'User already has stripe customerID!' });
    }
  } catch (error) {
    // Catch any errors and return an error response with the error message if it is present.
    if (error instanceof Error) {
      return Response.json({ error: error.message });
    } else {
      return Response.json({ error: 'Unexpected Error.' });
    }
  }
}
