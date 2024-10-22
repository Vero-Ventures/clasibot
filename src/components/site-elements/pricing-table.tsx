'use client';
import { useEffect, useState } from 'react';
import Script from 'next/script';
import { createCustomerSession } from '@/actions/stripe';

export default function PricingTable({
  publicKey,
  tableID,
}: {
  publicKey: string;
  tableID: string;
}) {
  // Define state to store and update the customer session.
  const [customerSession, setCustomerSession] = useState('');

  // Define function to fetch and set the customer session.
  const fetchCustomerSession = async () => {
    // Create a user stripe customer session.
    const userStripeCustomerSession = (await createCustomerSession()) as {
      customerSession: string;
    };

    // Set the customer session state with the retrieved value.
    setCustomerSession(userStripeCustomerSession.customerSession);
  };

  // Fetch the customer session on change of the public key value.
  useEffect(() => {
    // Fetch the customer session.
    fetchCustomerSession();
    // Set an interval to re-fetch the customer session every 30 minutes.
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
    <div className="pt-20">
      <Script
        id="StripePricingTableScript"
        src="https://js.stripe.com/v3/pricing-table.js"
        strategy="afterInteractive"
      />
      {/* If the customer session is present (logged in user), load the table using the customer's session. */}
      {customerSession && (
        <stripe-pricing-table
          pricing-table-id={tableID}
          publishable-key={publicKey}
          customer-session-client-secret={customerSession}
        />
      )}
    </div>
  );
}
