/**
 * Defines a test API route for getting user accounts using QuickBooks API.
 */
import { getAccounts } from '@/actions/quickbooks/get-accounts';

export async function GET() {
  // Call server action to get user accounts using QuickBooks API.
  // Call with either expense or transaction depending on account type needed.
  // Expense for possible classification accounts. Transaction for accounts that may contain 'for review' transactions.
  const accounts = await getAccounts('Expense');
  // Return the accounts as a JSON object.
  return Response.json(JSON.parse(accounts));
}
