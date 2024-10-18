import { getNextReviewTimestamp } from '@/actions/backend-functions/database-functions/next-review-timestamp';

export async function GET() {
  // Get the timestamp of the next backend review from the database.
  const response = await getNextReviewTimestamp();
  // Return the timestamp as a JSON object.
  return Response.json(response);
}
