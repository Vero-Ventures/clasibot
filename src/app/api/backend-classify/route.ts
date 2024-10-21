import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Get the authorization header from a standard Vercel cron job request.
  const authHeader = request.headers.get('authorization');
  // Check if the passed auth header matches the expeced value defined by the CRON_SECRET env.
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    // If the expeced auth is not found, return an unauthorized error.
    return new Response('Unauthorized', {
      status: 401,
    });
  }
}
