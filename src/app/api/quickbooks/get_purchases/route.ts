/**
 * Defines a test API route for getting user accounts using QuickBooks API.
 */
import { getPurchases } from '@/actions/quickbooks/purchases';

export async function GET() {
  // Call server action to get user accounts using QuickBooks API.
  const accounts = await getPurchases();
  // Return the accounts as a JSON object.
  return Response.json(accounts);
}
