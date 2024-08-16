import prisma from '@/lib/db';
import { Stripe } from 'stripe';
import { getServerSession } from 'next-auth/next';
import type { NextRequest } from 'next/server';
import { options } from '@/app/api/auth/[...nextauth]/options';

// Define the Stripe instance using the private key. Key value is determined by the enviroment.
const stripe = new Stripe(
  process.env.APP_CONFIG === 'production'
    ? (process.env.PROD_STRIPE_PRIVATE_KEY ?? '')
    : (process.env.DEV_STRIPE_PRIVATE_KEY ?? '')
);
// Define the price IDs for monthly and yearly subscriptions.
const priceIDs: { [key: string]: string } = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID ?? '',
  yearly: process.env.STRIPE_YEARLY_PRICE_ID ?? '',
};

export async function POST(req: NextRequest) {
  try {
    // Define the request URL, host, success URL, and cancel URL.
    const requestUrl = new URL(req.url);
    const host = requestUrl.host;
    const successUrl = `${requestUrl.protocol}//${host}/home`;
    const cancelUrl = `${requestUrl.protocol}//${host}/home`;

    // Get the tier from the request body.
    const { tier } = await req.json();
    if (!tier) {
      return Response.json({ error: 'Tier not provided' });
    }

    // Get the server session using the options.
    const serverSession = await getServerSession(options);

    if (!serverSession?.userId) {
      return Response.json({ error: 'Error getting session' });
    }

    // Find the user in the database using their ID, limited to true subscriptions.
    const user = await prisma.user.findUnique({
      where: { id: serverSession.userId },
      include: { subscription: true },
    });

    if (!user || !user.subscription?.stripeId) {
      return Response.json({ error: 'User missing stripeId!' });
    }

    const userStripeId = user.subscription?.stripeId;

    // Create the session using the stripe checkout.
    const session = await stripe.checkout.sessions.create({
      // Define the payment method and customer ID.
      payment_method_types: ['card'],
      customer: userStripeId,
      // Define a single line item being purchased with the priceID and the tier.
      line_items: [
        {
          price: priceIDs[tier],
          quantity: 1,
        },
      ],
      // Define the mode as subscription alongside the success and cancel URLs.
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    // Return the session ID as a Response.
    return Response.json({ sessionId: session.id });
  } catch (error) {
    // Return the error as a Response.
    return Response.json({ error });
  }
}
