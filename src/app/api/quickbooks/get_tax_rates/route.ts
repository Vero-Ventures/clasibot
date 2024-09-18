/**
 * Defines a test API route for getting user accounts using QuickBooks API.
 */
import { getTaxRates } from '@/actions/quickbooks/taxes';

export async function GET() {
  // Call server action to get user accounts using QuickBooks API.
  const taxRates = await getTaxRates();
  // Return the accounts as a JSON object.
  return Response.json(JSON.parse(taxRates));
}
