import { setNextReviewTimestamp } from '@/actions/backend-functions/database-functions/next-review-timestamp';

export async function GET() {
  // Set the timestamp of the next backend review to be 7 days from the current date.
  const response = await setNextReviewTimestamp();
  // Return the database timestamp as a JSON object.
  return Response.json(JSON.parse(response));
}
