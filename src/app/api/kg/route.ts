import { fetchKnowledgeGraph } from '@/actions/backend-functions/llm-prediction/knowledge-graph';

export async function GET(req: Request) {
  // Fetch the url and extract the query value.
  const url = new URL(req.url || '');
  const query = url.searchParams.get('query') ?? '';

  try {
    // Fetch the knowledge graph data for the provided query.
    const response = await fetchKnowledgeGraph(query);

    // Return the response as a JSON object with a success status of 200.
    return Response.json(response, { status: 200 });
  } catch (error) {
    // Catch any errors and return them with a bad request response status of 400.
    return Response.json(
      { error: 'Error fetching data', errorMessage: error },
      { status: 400 }
    );
  }
}
