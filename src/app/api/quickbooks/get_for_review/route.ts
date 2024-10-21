/**
 * Defines a test API route for getting a users 'For Review' transactions using QuickBooks API.
 */
import { getForReview } from '@/actions/backend-functions/get-for-review';

export async function GET() {
  const result = await getForReview('', '', '', '');
  if (result.result === 'Success') {
    return Response.json(JSON.parse(result.detail));
  } else {
    return Response.json(result);
  }
}
