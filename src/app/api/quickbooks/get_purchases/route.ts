import { findFormattedPurchase } from '@/actions/quickbooks/index';

export async function GET() {
  // Call action to find a specific Purchase from QuickBooks API.
  // Returns a formatted object.
  const purchase = await findFormattedPurchase('');

  // Return the Purchase as a JSON object.
  return Response.json(purchase);
}
