'use server';

import { google } from 'googleapis';

// Define an interface for the found and returned Knowledge Graph results.
interface KnowledgeGraphResult {
  name: string;
  resultScore: number;
  detailedDescription: string;
}
// Generates context for LLM using Google Knowledge Graph.
// Takes: A search query for a 'For Review' transaction.
// Returns an array of Knowledge Graph conext results.
export async function fetchKnowledgeGraph(
  query: string
): Promise<KnowledgeGraphResult[]> {
  // Create a new Knowledge Graph client and load the API key.
  const kgsearch = google.kgsearch('v1');
  const apiKey = process.env.GOOGLE_API_KEY;

  try {
    // Fetch Knowledge Graph context by defining the types of entities to search for.
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
          // Define an inital empty description, then update it if a detailed description was returned.
          let description = '';
          if (item.result.detailedDescription) {
            description = item.result.detailedDescription.articleBody;
          }
          // Return the Knowledge Graph results as a formatted Knowledge Graph Result object.
          return {
            name: item.result.name,
            resultScore: item.resultScore,
            detailedDescription: description,
          };
        }
      );
    } else {
      // If no response is returned, return an empty array as the Knowledge Graph Result object.
      return [];
    }
  } catch (error) {
    // Catch and log any errors that occured, include the error message if it is present.
    if (error instanceof Error) {
      console.error('Error fetching Knowledge Graph search: ' + error);
    } else {
      console.error('Unexpected error fetching Knowledge Graph.');
    }
    // On error, return an empty array as the Knowledge Graph Result object.
    return [];
  }
}
