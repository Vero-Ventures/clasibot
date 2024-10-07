/**
 * Defines a test API route for getting a users tax codes using QuickBooks API.
 */
import { getTaxCodes } from '@/actions/quickbooks/taxes';

export async function GET() {
  // Call server action to get user tax codes using QuickBooks API.
  const taxCodes = await getTaxCodes();
  // Return the accounts as a JSON object.
  return Response.json(JSON.parse(taxCodes));
}
