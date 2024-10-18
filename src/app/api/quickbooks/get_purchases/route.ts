import { findFormattedPurchase } from '@/actions/quickbooks/find-purchase';

export async function GET() {
  // Call server action to find a specific purchase using QuickBooks API.
  const purchase = await findFormattedPurchase('144');
  // Return the purchase as a JSON object.
  return Response.json(purchase);
}
