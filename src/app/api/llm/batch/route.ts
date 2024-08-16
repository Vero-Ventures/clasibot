import { batchQueryLLM } from '@/actions/llm-prediction/llm';
import type { Transaction } from '@/types/Transaction';
import type { CategorizedResult } from '@/types/CategorizedResult';

export async function POST(req: Request) {
  try {
    // Get the body from the request.
    const body = await req.json();
    const transactions: Transaction[] = body.transactions || [];
    const categories = body.categories;

    // Query the LLM model with the provided transactions and categories.
    const results: CategorizedResult[] = await batchQueryLLM(
      transactions,
      categories
    );

    // Return the results as a JSON object and a success status of 200.
    return Response.json(results, { status: 200 });
  } catch (error) {
    // Catch any errors and return them with a bad request response using the status 400.
    return Response.json(
      { error: 'Error fetching data', errorMessage: error },
      { status: 400 }
    );
  }
}
