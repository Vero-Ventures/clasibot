import type { NextRequest } from 'next/server';
import { classificationUserIteration } from '@/actions/backend-functions/user-company-selection/user-iteration';

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
    // Call user iteration function to start the process of company 'For Review' transaction classification.
    classificationUserIteration();

    // After starting async & concurrent classification of 'For Review' transactions in user companies.
    // Return a response to indicate the the weekly classification was started successful.
    return new Response('Weekly Background Classification Started.', {
      status: 200,
    });
  }
}
