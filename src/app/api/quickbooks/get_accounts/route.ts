import { getAccounts } from '@/actions/quickbooks/get-accounts';

export async function GET() {
  // Call server action to get user accounts using QuickBooks API.
  // Call with either 'Expense' or 'Transaction' depending on account type needed.
  const accounts = await getAccounts('Expense');
  // Return the accounts as a JSON object.
  return Response.json(JSON.parse(accounts));
}
