import { default as defaultMiddleware } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { NextRequestWithAuth } from 'next-auth/middleware';
import { siteConfig } from '@/site-config/site';

export function middleware(request: NextRequest) {
  const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
  const pathname = request.nextUrl.pathname;

  // Define allowed paths using the footer items array inside site config file.
  const allowedPaths = siteConfig.footerItems.map((item) => item.href);

  // Ignore the middleware for landing page, allowed paths, and signin call from home.
  if (allowedPaths.includes(pathname) || pathname === '/') {
    return NextResponse.next();
  }

  // If callback URL is present, the user is trying to be forced to log in.
  // Redirect to landing page instead where the sign in button is located.
  if (callbackUrl) {
    const baseUrl = new URL(request.url);
    return NextResponse.redirect(new URL(baseUrl.origin));
  }

  // Callback URL is not present when login is done by landing page button.
  // If not an allowed path and callback URL is not present, must be a valid login attempt.
  // Continue with the default middleware to take user to QuickBooks login page.
  return defaultMiddleware(request as NextRequestWithAuth);
}
