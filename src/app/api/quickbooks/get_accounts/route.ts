/**
 * Defines a test API route for getting user accounts using QuickBooks API.
 */
import { getIsAccounant } from '@/actions/quickbooks/user-info'

export async function GET() {
  // Call server action to get user accounts using QuickBooks API.
  // Call with either expense or transaction depending on account type needed.
  // Expense for possible classification accounts. Transaction for accounts that may contain 'for review' transactions.
  const accounts = await getIsAccounant();
  // Return the accounts as a JSON object.
  return Response.json(accounts);
}
