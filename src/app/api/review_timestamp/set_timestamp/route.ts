import { setNextReviewTimestamp } from '@/actions/backend-functions/database-functions/next-review-timestamp';

export async function GET() {
  const response = await setNextReviewTimestamp();
  // Return the accounts as a JSON object.
  return Response.json(JSON.parse(response));
}
