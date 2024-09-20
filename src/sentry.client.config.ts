// Cnfigures the initialization of Sentry on the client.
// Used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { init, replayIntegration, feedbackIntegration } from '@sentry/nextjs';

init({
  // Connection to sentry.
  dsn: 'https://0207f971b81173696314228376c37a4a@o4507575728013312.ingest.us.sentry.io/4507578745421824',

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. May increase up to 100% while in development.
  replaysSessionSampleRate: 0.1,

  // Optional setup for the Sentry Session Replay feature:
  integrations: [
    replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
    feedbackIntegration({
      // Additional SDK configuration goes in here, for example:
      colorScheme: 'light',
      isEmailRequired: true,
    }),
  ],
});
