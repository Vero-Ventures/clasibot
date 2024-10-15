import { getNextReviewTimestamp } from '@/actions/backend-functions/database-functions/next-review-timestamp';

export async function GET() {
  const response = await getNextReviewTimestamp();
  // Return the accounts as a JSON object.
  return Response.json(response);
}
