/**
 * Defines a test API route for getting user transactions using QuickBooks API.
 */
import { getTransactions } from '@/actions/quickbooks/get-transactions';

export async function GET() {
  // Call server action to get user accounts from the QuickBooks API.
  const transactions = await getTransactions();
  // Return the transactions as a JSON object.
  return Response.json(JSON.parse(transactions));
}
