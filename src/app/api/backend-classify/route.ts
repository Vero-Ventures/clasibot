import type { NextRequest } from 'next/server';
import { classificationUserIteration } from '@/actions/backend-actions/user-company-selection/user-iteration';

export async function GET(request: NextRequest) {
  // Get the authorization header from the request.
  const authHeader = request.headers.get('authorization');

  // Check for an auth header that matches the expeced value, defined by the CRON_SECRET env.
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // If the expeced auth header is not found or invalid, return an unauthorized error.
    return new Response('Unauthorized', {
      status: 401,
    });
  } else {
    // If the call is a valid vercel cron job request,
    // Call User iteration function to start the process of Company 'For Review' transaction Classification.
    classificationUserIteration();

    // After starting async & concurrent Classification of 'For Review' transactions in User Companies.
    // Return a response to indicate the the weekly Classification was started successful.
    return new Response('Weekly Background Classification Started.', {
      status: 200,
    });
  }
}
