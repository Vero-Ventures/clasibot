import { fetchCustomSearch } from '@/actions/backend-actions/llm-prediction/custom-search';

export async function GET(req: Request) {
  // Fetch the url of the get request and extract the query value.
  const url = new URL(req.url || '');
  const query = url.searchParams.get('query') ?? '';

  try {
    // Fetch the Custom Search data for the provided query.
    const response = await fetchCustomSearch(query);

    // Return the response with a success status code of 200.
    return Response.json(response, { status: 200 });
  } catch (error) {
    // Catch any errors fetching the Custom Search context.
    // Return the error as an error response with a status code of 400.
    return Response.json(
      { error: 'Error fetching data', errorMessage: error },
      { status: 400 }
    );
  }
}
