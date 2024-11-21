import { getAccounts } from '@/actions/quickbooks/index';

export async function GET() {
  // Call action to get formatted User Accounts from QuickBooks API.
  // Call with either 'Expense' or 'Transaction' type depending on Accounts needed.
  const accounts = await getAccounts('Expense');

  // Return the Accounts as a JSON object.
  return Response.json(JSON.parse(accounts));
}
