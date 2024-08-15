'use client';
import { useEffect, useState } from 'react';
import Script from 'next/script';
import { createCustomerSession } from '@/actions/stripe';

export default function PricingTable() {
  // Create use state to store and update the customer session.
  const [customerSession, setCustomerSession] = useState('');

  // Create a function to fetch the customer session.
  const fetchCustomerSession = async () => {
    // Create a user stripe customer session using the createCustomerSession function.
    const userStripeCustomerSession = (await createCustomerSession()) as {
      customerSession: string;
    };

    // Set the customer session value using the retrieved user stripe customer session.
    setCustomerSession(userStripeCustomerSession.customerSession);
  };

  // Use the useEffect hook to fetch the customer session.
  useEffect(() => {
    // Fetch the customer session.
    fetchCustomerSession();
    // Set an interval to fetch the customer session every 30 minutes.
    const interval = setInterval(
      () => {
        fetchCustomerSession();
      },
      // 1000 milliseconds * 60 seconds * 30 minutes
      30 * 60 * 1000
    );

    // Clear the interval when the component is unmounted to stop the repeated fetch.
    return () => clearInterval(interval);
  }, []);

  // Define the variables for the Stripe client ID and secret.
  let usePublic;
  let useSecret;

  // Set the Stripe client ID and secret based on the environment.
  if (process.env.APP_CONFIG === 'production') {
    usePublic = process.env.DEV_NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
    useSecret = process.env.DEV_STRIPE_PRIVATE_KEY;
  } else {
    usePublic = process.env.PROD_NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
    useSecret = process.env.PROD_STRIPE_PRIVATE_KEY;
  }

  return (
    <div className="pt-20">
      <Script
        id="StripePricingTableScript"
        src="https://js.stripe.com/v3/pricing-table.js"
        strategy="afterInteractive"
      />
      {/* If the customer session is present (logged in user), load the table using the customer's session. */}
      {customerSession && (
        <stripe-pricing-table
          pricing-table-id={usePublic ?? ''}
          stripe-private-key={useSecret ?? ''}
          customer-session-client-secret={customerSession}
        />
      )}
    </div>
  );
}
