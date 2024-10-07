/**
 * Defines a test API route for getting past user transactions using QuickBooks API.
 */
import { getPastTransactions } from '@/actions/quickbooks/get-transactions';

export async function GET() {
  // Call server action to get a users past transactions from the QuickBooks API.
  const transactions = await getPastTransactions();
  // Return the transactions as a JSON object.
  return Response.json(JSON.parse(transactions));
}
