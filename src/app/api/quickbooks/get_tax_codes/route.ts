import { getTaxCodes } from '@/actions/quickbooks/taxes';

export async function GET() {
  // Call action to get formatted User Tax Codes from QuickBooks API.
  const taxCodes = await getTaxCodes();

  // Return the Tax Codes as a JSON object.
  return Response.json(JSON.parse(taxCodes));
}
