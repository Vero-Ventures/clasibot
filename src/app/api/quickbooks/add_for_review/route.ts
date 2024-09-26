/**
 * Defines a test API route for making sql request to the QuickBooks API 'query' endpoint.
 */
import { getForReview } from '@/actions/quickbooks/get-for-review';
import { addForReview } from '@/actions/quickbooks/add-for-review';
// import type { ForReviewTransaction } from '@/types/ForReviewTransaction';

export async function GET() {
// updatedTransaction: ForReviewTransaction,
// classificationId: string,
// taxCodeId: string
  const updatedTransaction = JSON.parse((await getForReview('144')).detail);

  const result = await addForReview(updatedTransaction[1][1], '129', '3');
  if (result.result === 'Success') {
    return Response.json(JSON.parse(result.detail));
  } else {
    return Response.json(result);
  }
}
