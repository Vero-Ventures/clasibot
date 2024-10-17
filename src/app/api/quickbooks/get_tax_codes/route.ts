import { getTaxCodes } from '@/actions/quickbooks/taxes';

export async function GET() {
  // Call server action to get user tax codes using QuickBooks API.
  const taxCodes = await getTaxCodes();
  // Return the tax codes as a JSON object.
  return Response.json(JSON.parse(taxCodes));
}
