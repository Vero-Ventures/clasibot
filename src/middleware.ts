import { default as defaultMiddleware } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { NextRequestWithAuth } from 'next-auth/middleware';
import { siteConfig } from '@/site-config/site';

export function middleware(request: NextRequest) {
  // Define the current pathname and a callback url if one is present.
  const pathname = request.nextUrl.pathname;
  const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');

  // Define allowed paths for non-logged in users to redirect to footer pages.
  const footerPaths = siteConfig.footerItems.map((link) => link.href);

  // Check the current path to see if it is for the landing page, home page, or one of the allowed paths.
  if (
    footerPaths.includes(pathname) ||
    pathname === '/' ||
    pathname === '/home'
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
