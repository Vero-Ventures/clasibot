'use client';
import { useEffect, useState } from 'react';
import Script from 'next/script';
import { createCustomerSession } from '@/actions/stripe';

export default function PricingTable({ publicKey }: { publicKey: string }) {
  // Create use state to store and update the customer sessi  on.
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
    console.log(publicKey);
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
  }, [publicKey]);

  return (
    <div className="pt-20">
      <Script
        id="StripePricingTableScript"
        src="https://js.stripe.com/v3/pricing-table.js"
        strategy="afterInteractive"
      />
      {/* If the customer session is present (logged in user), load the table using the customer's session. */}
      {/* Define the public and provate keys using a production check and a blank value for null env values. */}
      {customerSession && (
        <stripe-pricing-table
          pricing-table-id="prctbl_1PfW1JB6Mh2CRTYeCybS5NlU"
          publishable-key={publicKey}
          customer-session-client-secret={customerSession}
        />
      )}
    </div>
  );
}
