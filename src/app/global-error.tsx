/**
 * Defines global error component that captures and reports errors to Sentry.
 */
'use client';

import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';
import { useEffect } from 'react';

// Global error component that captures and reports errors to Sentry.
export default function GlobalError({
  error,
}: {
  readonly error: Error & { digest?: string };
}) {
  // have sentry capture the error whenever a new error is rendered.
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        {/* `NextError` is the default Next.js error page component. Its type
        definition requires a `statusCode` prop. However, since the App Router
        does not expose status codes for errors, we simply pass 0 to render a
        generic error message. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
