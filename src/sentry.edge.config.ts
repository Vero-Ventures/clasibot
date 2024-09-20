// Configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// Used whenever one of the edge features is loaded.
// Note: Unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { init } from '@sentry/nextjs';

init({
  // Connection to sentry.
  dsn: 'https://0207f971b81173696314228376c37a4a@o4507575728013312.ingest.us.sentry.io/4507578745421824',

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
