/**
 * Defines a test API route for making sql request to the QuickBooks API 'query' endpoint.
 */
import { getForReview } from '@/actions/quickbooks/get-for-review';

export async function GET() {
  return await getForReview('144');
}
