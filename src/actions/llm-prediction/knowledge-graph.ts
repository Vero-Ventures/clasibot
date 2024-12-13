'use server';

import { google } from 'googleapis';

// Define an interface for the Knowledge Graph results.
interface KnowledgeGraphResult {
  name: string;
  relevanceScore: number;
  detailedDescription: string;
}

// Takes: A search query for a 'For Review' transaction.
// Returns: An array of Knowledge Graph conext results with a single value.
export async function fetchKnowledgeGraph(
  query: string
): Promise<KnowledgeGraphResult[]> {
  // Create a new Knowledge Graph client and load the API key.
  const kgsearch = google.kgsearch('v1');
  const apiKey = process.env.GOOGLE_API_KEY;

  try {
    // Fetch Knowledge Graph context using the query and by defining the entity types to search for.
    // Limited to a single result for clearer use in predictions.
    const response = await kgsearch.entities.search({
      query,
      auth: apiKey,
      types: ['Organization', 'Corporation', 'LocalBusiness'],
      limit: 1,
      indent: true,
    });

    // If a response is returned, format the data to the define Knowledge Graph Result object.
    if (response.data.itemListElement) {
      return response.data.itemListElement.map(
        (item: {
          result: {
            name: string;
            detailedDescription: { articleBody: string };
          };
          resultScore: number;
        }) => {
          // Define an inital empty description and a relevance score of 0.
          let description = '';
          let relevanceScore = 0;

          // Update the relevance and description if a detailed description was returned.
          if (item.result.detailedDescription) {
            description = item.result.detailedDescription.articleBody;
            relevanceScore = item.resultScore;
          }

          // Return the Knowledge Graph results as a formatted Knowledge Graph Result object.
          return {
            name: item.result.name,
            relevanceScore: relevanceScore,
            detailedDescription: description,
          };
        }
      );
    } else {
      // If no response is returned, return an empty array.
      return [];
    }
  } catch (error) {
    // Catch and log any errors that occured, include the error message if it is present.
    if (error instanceof Error) {
      console.error('Error fetching Knowledge Graph search: ' + error);
    } else {
      console.error('Unexpected error fetching Knowledge Graph.');
    }
    // On error, return an empty array.
    return [];
  }
}
