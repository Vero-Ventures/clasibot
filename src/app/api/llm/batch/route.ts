import {
  batchQueryCategoriesLLM,
  batchQueryTaxCodesLLM,
} from '@/actions/llm-prediction/llm';
import type { ClassifiedResult } from '@/types/Classification';
import type { CompanyInfo } from '@/types/CompanyInfo';
import type { FormattedForReviewTransaction } from '@/types/ForReviewTransaction';

export async function POST(req: Request) {
  try {
    // Get the body from the request.
    const body = await req.json();
    const transactions: FormattedForReviewTransaction[] =
      body.transactions || [];
    const companyInfo: CompanyInfo = body.companyInfo;
    const categories = body.categories;
    const type: string = body.type;

    if (type === 'category') {
      const results: ClassifiedResult[] = await batchQueryCategoriesLLM(
        transactions,
        categories,
        companyInfo
      );
      return Response.json(results, { status: 200 });
    } else if (type === 'tax code') {
      const taxCodes = body.taxCodes;
      const results: ClassifiedResult[] = await batchQueryTaxCodesLLM(
        transactions,
        categories,
        taxCodes,
        companyInfo
      );
      return Response.json(results, { status: 200 });
    } else {
      // Catch any errors and return them with a bad request response using the status 400.
      return Response.json(
        { error: 'Error, invalid query type' },
        { status: 400 }
      );
    }
  } catch (error) {
    // Catch any errors and return them with a bad request response using the status 400.
    return Response.json(
      { error: 'Error fetching data', errorMessage: error },
      { status: 400 }
    );
  }
}
