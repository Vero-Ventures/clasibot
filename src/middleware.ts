import { default as defaultMiddleware } from 'next-auth/middleware';
import type { NextRequestWithAuth } from 'next-auth/middleware';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { siteConfig } from '@/site-config/site';

export function middleware(request: NextRequest) {
  // Define the current pathname and checks the url for a defined callback url.
  const pathname = request.nextUrl.pathname;
  const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');

  // Define allowed paths for non-logged in users and API paths that can be called externally without a session.
  // Allowed paths are defined in site config for both user pages and API endpoints.
  const footerPaths = siteConfig.footerItems.map((link) => link.href);
  const apiEndpoints = siteConfig.apiEndpoints.map((path) => path.href);

  // Check the current path to see if it is one of the paths allowed access without a session.
  if (
    pathname === '/' ||
    pathname === '/home' ||
    footerPaths.includes(pathname) ||
    apiEndpoints.includes(pathname)
  ) {
    // Ignore the middleware functions and continue as normal.
    return NextResponse.next();
  }

  // If a callback is present in the url, the middleware is forcing the user to log in.
  // Redirect to landing page instead of the default middleware login page.
  if (callbackUrl) {
    const baseUrl = new URL(request.url);
    return NextResponse.redirect(new URL(baseUrl.origin));
  }

  // If not an allowed path without session and no callback is present in the URL:
  // Must be a valid login call, continue to QuickBooks login page.
  return defaultMiddleware(request as NextRequestWithAuth);
}
