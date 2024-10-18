import { default as defaultMiddleware } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { NextRequestWithAuth } from 'next-auth/middleware';
import { siteConfig } from '@/site-config/site';

export function middleware(request: NextRequest) {
  // Define the current pathname and the callback url if it is present.
  const pathname = request.nextUrl.pathname;
  const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');

  // Define allowed paths for the footer items using an array of strings inside site config file.
  const allowedPaths = siteConfig.footerItems.map((item) => item.href);

  // Check the path if for the landing page, allowed paths, or signin call.
  if (allowedPaths.includes(pathname) || pathname === '/') {
    // Ignore the middleware functions and continue as normal.
    return NextResponse.next();
  }

  // If callback URL is present, the middleware is forcing the user to log in.
  // Redirect to landing page instead where of the default middleware actions.
  if (callbackUrl) {
    const baseUrl = new URL(request.url);
    return NextResponse.redirect(new URL(baseUrl.origin));
  }

  // If not an allowed path and callback URL is not present, must be a valid login call.
  // Continue with the default middleware to take user to QuickBooks login page.
  return defaultMiddleware(request as NextRequestWithAuth);
}
