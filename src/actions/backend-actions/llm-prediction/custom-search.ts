'use server';
import type { customsearch_v1 } from 'googleapis';
import { google } from 'googleapis';

// Takes a search query for a 'For Review' transaction from the LLM and uses Google CSE to generate context.
// Returns an array of CSE conext results.
export async function fetchCustomSearch(
  query: string
): Promise<customsearch_v1.Schema$Result[]> {
  // Check that Custom Search is enabled.
  const enableCustomSearch = process.env.ENABLE_GOOGLE_CSE === 'false';

  // If Custom Search is disabled, return an empty array as the CSE context.
  if (enableCustomSearch) {
    return [];
  } else {
    // Create a new Custom Search client and load the API key.
    const customsearch = google.customsearch('v1');
    const apiKey = process.env.GOOGLE_API_KEY;

    try {
      // Fetch Custom Searchresults using the API key, Custom Search Engine Id, and query.
      // Limits the number of results to 3.
      const response = await customsearch.cse.list({
        auth: apiKey,
        cx: process.env.GOOGLE_CSE_CX,
        q: query,
        num: 3,
      });

      // If a response is returned, format and return the data.
      if (response.data.items) {
        return response.data.items.map((item) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
        }));
      } else {
        // If no response is returned, return an empty array as the CSE context.
        return [];
      }
    } catch (error) {
      // Catch and log any errors that occured, include the error message if it is present.
      if (error instanceof Error) {
        console.error('Error fetching Custom Search results: ' + error.message);
      } else {
        console.error('Unexpected error fetching Custom Search results.');
      }
      // Return an empty array as the CSE context.
      return [];
    }
  }
}
