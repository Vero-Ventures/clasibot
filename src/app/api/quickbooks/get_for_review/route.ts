/**
 * Defines a test API route for making sql request to the QuickBooks API 'query' endpoint.
 */
import { getForReview } from '@/actions/quickbooks/get-for-review';

export async function GET() {
  const result = await getForReview('144');
  if (result.result === 'Success') {
    return Response.json(JSON.parse(result.detail));
  } else {
    return Response.json(result);
  }
}
