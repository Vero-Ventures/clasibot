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
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Define sentry organization and project
  org: 'vero-ventures',
  project: 'accubot',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // Note: Check that the configured route will not match with your Next.js middleware,
  // otherwise reporting of client-side errors will fail.
  tunnelRoute: '/monitoring',

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors.
  // (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
};

// Export the final configuration as a default export function.
// Returns the result of a config function that is passed the sentry config data.
export async function config() {
  const mdxConfig = await withMDX()(nextConfig);
  return withSentryConfig(mdxConfig, sentryConfig);
}
