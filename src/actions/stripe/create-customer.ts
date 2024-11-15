'use server';
import { db } from '@/db/index';
import { Subscription, User } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Stripe } from 'stripe';

// Create a new Stripe object with the private key.
// Used to create a Stripe User.
const stripe = new Stripe(
  process.env.APP_CONFIG === 'production'
    ? (process.env.PROD_STRIPE_PRIVATE_KEY ?? '')
    : (process.env.DEV_STRIPE_PRIVATE_KEY ?? '')
);

// Creates a new Stripe Customer and records their Stripe Id to a User database Subscription object.
// Takes: A User Id as a string to create a Stripe Id.
// Returns: A response object containing a success message or an error.
export default async function createCustomer(
  userId: string
): Promise<Response> {
  try {
    // Find the database Subscription object by matching the User Id to the passed value.
    const subscription = await db
      .select()
      .from(Subscription)
      .where(eq(Subscription.userId, userId));

    // If no Subscription was found, return an error.
    if (!subscription[0]) {
      return Response.json({ error: 'User not found!' });
    }

    // Check for a User Stripe Id in the Subscription object.
    const userStripeId = subscription[0]?.stripeId;
    // If no Stripe Id is found, create a new Customer with the User email and name.
    if (!userStripeId) {
      // Get the User object from the database using the passed User Id.
      const user = await db.select().from(User).where(eq(User.id, userId));

      // If the fetched User does not exist, return an error.
      if (!user[0]) {
        return Response.json({ error: 'User not found!' });
      }

      // Create a Customer object with a email and name pulled from the database User object.
      const customer = await stripe.customers.create({
        // Asserts a non-null values through the returning on null check above.
        email: user[0].email!,
        name: user[0].userName!,
      });

      // Update the database Subscription object connected to the User with the new Stripe Id.
      await db
        .update(Subscription)
        .set({
          stripeId: customer.id,
        })
        .where(eq(Subscription.userId, user[0].id));

      // Return a response indicating the Customer was created.
      return Response.json({ message: 'Customer created!' });
    } else {
      // If the User already has a Stripe Id, return an error.
      return Response.json({ error: 'User already has Stripe Customer Id!' });
    }
  } catch (error) {
    // Catch any errors and return an error response, include the error message if it is present.
    if (error instanceof Error) {
      return Response.json({ error: error.message });
    } else {
      return Response.json({ error: 'Unexpected Error.' });
    }
  }
}
