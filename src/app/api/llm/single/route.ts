import { queryLLM } from '@/actions/llm-prediction/llm';

export async function POST(req: Request) {
  // Get the body from the request.
  const body = await req.json();
  // Parse the query and context from the body.
  const { query, context } = body;
  try {
    // Query the LLM model with the provided fields.
    const response = await queryLLM(query, context);
    // Return the response as a JSON object and a success status of 200.
    return Response.json(response, { status: 200 });
  } catch (error) {
    // Catch any errors and return them with a bad request response using the status 400.
    return Response.json(
      { error: 'Error fetching data', errorMessage: error },
      { status: 400 }
    );
  }
}
