/**
 * Defines a test API route for getting a users accounts using QuickBooks API.
 */
import { getPurchases } from '@/actions/quickbooks/purchases';

export async function GET() {
  // Call server action to get a users pruchases using QuickBooks API.
  // This form of call is never made, use as a refernce for what kind of object findFormattedPurchase returns.
  const accounts = await getPurchases();
  // Return the accounts as a JSON object.
  return Response.json(accounts);
}
