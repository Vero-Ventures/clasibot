// This file configures the initialization of Sentry for edge features (middleware, edge routes, etc.).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config file is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://df45ef6483f7b1f7044dcc83b69bc7ea@o4507575728013312.ingest.us.sentry.io/4507986455494656',

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
