// Declare the interface for the Stripe Pricing Table component within the JSX namespace.
// Allows the stripe table to be rendered inside typescript files.
declare namespace JSX {
  interface IntrinsicElements {
    'stripe-pricing-table': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      'pricing-table-id': string;
      'publishable-key': string;
      'customer-session-client-secret': string;
    };
  }
}
