import { classificationUserIteration } from '@/actions/backend-functions/user-company-selection/user-iteration';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Get the authorization header from a standard Vercel cron job request.
  const authHeader = request.headers.get('authorization');
  // Check if the passed auth header matches the expeced value defined by the CRON_SECRET env.
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // If the expeced auth is not found, return an unauthorized error.
    return new Response('Unauthorized', {
      status: 401,
    });
  } else {
    // If the call is a valid vercel cron job, call function to iterate over users for company selection and classification.
    classificationUserIteration();

    // After starting async + concurrent classification of 'For Review' transactions in user companies.
    // Return a new response to indicate the call to start weekly was successful.
    return new Response('Weekly Background Classification Started.', {
      status: 200,
    });
  }
}
