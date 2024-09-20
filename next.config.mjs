import { withSentryConfig } from '@sentry/nextjs';
import withMDX from '@next/mdx';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cdn3.emoji.gg'],
  },
  // Define file types to be considered as pages
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
};

const sentryConfig = {
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Define sentry organization and project
  org: 'vero-ventures',
  project: 'accubot',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // Note: Ensure the configured route does not match the Next.js middleware,
  // Otherwise client-side error reporting will fail.
  tunnelRoute: '/monitoring',

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors.
  // (Does not yet work with App Router route handlers.)
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
};

// Export the final configuration as a default export function.
// Returns the result of config function that takes the MDX and sentry config values.
export default async function config() {
  const mdxConfig = await withMDX()(nextConfig);
  return withSentryConfig(mdxConfig, sentryConfig);
}
