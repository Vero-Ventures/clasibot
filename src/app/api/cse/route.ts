
import { fetchCustomSearch } from '@/actions/llm-prediction/custom-search';

export async function GET(req: Request) {
  // Define the url and get the query from the url.
  const url = new URL(req.url || '');
  const query = url.searchParams.get('query') ?? '';

  try {
    // Fetch the custom search data with the provided query.
    const response = await fetchCustomSearch(query);

    // Return the response as a JSON object and a success status of 200.
    return Response.json(response, { status: 200 });
  } catch (error) {
    // Catch any errors and return them with a bad request response using the status 400.
    return Response.json({ error: 'Error fetching data', errorMessage: error }, { status: 400 });
  }
}
