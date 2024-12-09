import { default as defaultMiddleware } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { NextRequestWithAuth } from 'next-auth/middleware';
import { siteConfig } from '@/site-config/site';

export function middleware(request: NextRequest) {
  // Define the current pathname and check for a callback url.
  const pathname = request.nextUrl.pathname;
  const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');

  // Define allowed paths for non-logged in users with an array of valid endpoints defined by the site config file.
  // Footer redirect paths and API endpoints for Email monitoring.
  const footerPaths = siteConfig.footerItems.map((link) => link.href);
  const emailApiEndpoints = siteConfig.emailEndpoints.map((path) => path.href);

  // Check the current path to see if it is for the landing page, one of the allowed paths, or a signin call.
  // Landing and home page handle their own session based redirects.
  if (
    pathname === '/' ||
    pathname === '/home' ||
    footerPaths.includes(pathname) ||
    emailApiEndpoints.includes(pathname)
  ) {
    // Ignore the middleware functions and continue as normal.
    return NextResponse.next();
  }

  // If a callback URL is present, the middleware is forcing the user to log in.
  // Redirect to landing page instead of the default middleware location.
  if (callbackUrl) {
    const baseUrl = new URL(request.url);
    return NextResponse.redirect(new URL(baseUrl.origin));
  }

  // If not an allowed path and callback URL is not present, must be a valid login call.
  // Continue with the default middleware to take user to QuickBooks login page.
  return defaultMiddleware(request as NextRequestWithAuth);
}
