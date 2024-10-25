import { getSavedTransactions } from '@/actions/quickbooks/get-saved-transactions';

export async function GET() {
  // Call action to get a formatted version of the User Transactions from QuickBooks API.
  // Returns the previously Classified and saved Transactions.
  const transactions = await getSavedTransactions();

  // Return the Transactions as a JSON object.
  return Response.json(JSON.parse(transactions));
}
