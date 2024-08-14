import { default as defaultMiddleware } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { NextRequestWithAuth } from 'next-auth/middleware';
import { siteConfig } from '@/site-config/site';

export function middleware(request: NextRequest) {
  // Get the callback URL from the query string.
  const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
  // Extract the pathname from the URL.
  const pathname = request.nextUrl.pathname;
  // Define allowed paths using the footer items from the site config.
  const allowedPaths = siteConfig.footerItems.map((item) => item.href);
  // If the pathname is in the allowed paths or is the landing page, continue with the default middleware.
  if (allowedPaths.includes(pathname) || pathname === '/') {
    return NextResponse.next();
  }
  // If the pathname is not in allowed paths and the callback URL is present, rewrite the URL.
  if (callbackUrl) {
    const baseUrl = new URL(request.url);
    return NextResponse.redirect(new URL(baseUrl.origin));
  }
  // If not accessing a restricted or allowed page, continue with the default middleware.
  // Only done when redirecting to login page.
  return defaultMiddleware(request as NextRequestWithAuth);
}
