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

  // Get the for review transactions from a specific account for testing.
  const updatedTransaction = await getForReview('144');

  // Check that the transaction fetch was a success and the detail results exist.
  if (updatedTransaction.result === 'Success' && updatedTransaction.detail) {
    // Parse the detail results and get the index of the testing "for review" transaction object.
    const updateTransactionData = JSON.parse(updatedTransaction.detail)[1][1];
    // Pass the update transaction data alongside a test accountId and taxCodeId.
    const result = await addForReview(updateTransactionData, '129', '3');
    // Check the result and if the detail is present and return a value accordingly.
    if (result.result === 'Success' && result.detail) {
      return Response.json(JSON.parse(result.detail));
    } else {
      return Response.json(result);
    }
  } else {
    return Response.json(updatedTransaction)
  }
}
