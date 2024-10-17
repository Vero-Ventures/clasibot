import { getSavedTransactions } from '@/actions/quickbooks/get-saved-transactions';

export async function GET() {
  // Call server action to get user past saved transactions from the QuickBooks API.
  const transactions = await getSavedTransactions();
  // Return the transactions as a JSON object.
  return Response.json(JSON.parse(transactions));
}
