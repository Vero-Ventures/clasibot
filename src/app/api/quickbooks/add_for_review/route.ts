/**
 * Defines a test API route for making sql request to the QuickBooks API 'query' endpoint.
 */
import { addForReview } from '@/actions/quickbooks/add-for-review';
import type {ForReviewTransaction} from '@/types/ForReviewTransaction'

export async function POST(updatedTransaction: ForReviewTransaction, classificationId: string, taxCodeId: string) {
  const result = await addForReview(updatedTransaction, classificationId, taxCodeId);
  if (result.result === 'Success') {
    return Response.json(JSON.parse(result.detail));
  } else {
    return Response.json(result)
  }
}
