import { batchQueryLLM } from '@/actions/llm-prediction/llm';
import type { CategorizedResult } from '@/types/Category';
import type { CompanyInfo } from '@/types/CompanyInfo';
import { FormattedForReviewTransaction } from '@/types/ForReviewTransaction';

export async function POST(req: Request) {
  try {
    // Get the body from the request.
    const body = await req.json();
    const transactions: FormattedForReviewTransaction[] = body.transactions || [];
    const categories = body.categories;
    const companyInfo: CompanyInfo = body.companyInfo

    // Query the LLM model with the provided transactions and categories.
    const results: CategorizedResult[] = await batchQueryLLM(
      transactions,
      categories,
      companyInfo
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
