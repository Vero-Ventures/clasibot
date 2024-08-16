'use server';
import { google } from 'googleapis';

// Define an interface for the returned knowledge graph results.
interface KnowledgeGraphResult {
  name: string;
  resultScore: number;
  detailedDescription: string;
}

export async function fetchKnowledgeGraph(
  query: string
): Promise<KnowledgeGraphResult[]> {
  // Create a new knowledge graph client and load the API key.
  const kgsearch = google.kgsearch('v1');
  const apiKey = process.env.GOOGLE_API_KEY;

  try {
    // Fetch knowledge graph results using the API key and the query.
    // Defines the types of entities to search for and limits the number of results to 1.
    const response = await kgsearch.entities.search({
      query,
      auth: apiKey,
      types: ['Organization', 'Corporation', 'LocalBusiness'],
      limit: 1,
      indent: true,
    });

    // If a response is returned, reformat the data to be returned.
    if (response.data.itemListElement) {
      return response.data.itemListElement.map(
        (item: {
          result: {
            name: string;
            detailedDescription: { articleBody: string };
          };
          resultScore: number;
        }) => {
          // Define an empty description, then check if a detailed description was returned and update the description.
          let description = '';
          if (item.result.detailedDescription) {
            description = item.result.detailedDescription.articleBody;
          }
          // Return the reformatted result.
          return {
            name: item.result.name,
            resultScore: item.resultScore,
            detailedDescription: description,
          };
        }
      );
    } else {
      // If no response is returned, return an empty array.
      return [];
    }
  } catch (error) {
    // Log any errors that occur and return an empty array.
    console.error('Error fetching knowledge graph:', error);
    return [];
  }
}
