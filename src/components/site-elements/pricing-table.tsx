'use client';

import { useEffect, useState } from 'react';

import Script from 'next/script';

import { createCustomerSession } from '@/actions/stripe';

// Takes: Stripe Env variables used to define the pricing table.
export function PricingTable({
  publicKey,
  tableId,
}: {
  publicKey: string;
  tableId: string;
}) {
  // Define state to store and update the Customer session.
  const [customerSession, setCustomerSession] = useState('');

  // Define function to fetch and set the Customer session.
  const fetchCustomerSession = async () => {
    // Create a user Stripe Customer session.
    const userStripeCustomerSession = (await createCustomerSession()) as {
      customerSession: string;
    };

    // Set the Customer session state with the retrieved value.
    setCustomerSession(userStripeCustomerSession.customerSession);
  };

  // Fetch the Customer session on change of the public key value.
  useEffect(() => {
    // Fetch the Customer session.
    fetchCustomerSession();
    // Set an interval to re-fetch the Customer session every 30 minutes.
    const interval = setInterval(
      () => {
        fetchCustomerSession();
      },
      30 * 60 * 1000
    );

    // Clear the interval when the component is unmounted to stop repeated fetches.
    return () => clearInterval(interval);
  }, [publicKey]);

  return (
    <div className="mx-auto my-6 w-fit rounded-lg border-4 border-gray-400 border-opacity-80 py-4 shadow-lg transition-transform duration-500 hover:scale-105 hover:shadow-2xl sm:px-6">
      <Script
        id="StripePricingTableScript"
        src="https://js.stripe.com/v3/pricing-table.js"
        strategy="afterInteractive"
      />
      {/* If the Customer session is present (logged in user), load the table using the Customer's session. */}
      {customerSession && (
        <stripe-pricing-table
          pricing-table-id={tableId}
          publishable-key={publicKey}
          customer-session-client-secret={customerSession}
        />
      )}
    </div>
  );
}
