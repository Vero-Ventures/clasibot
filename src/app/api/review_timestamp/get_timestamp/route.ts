import { getNextReviewTimestamp } from '@/actions/backend-classification/next-review-timestamp';

export async function GET() {
  const response = await getNextReviewTimestamp();
  // Return the accounts as a JSON object.
  return Response.json(response);
}
