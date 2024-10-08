'use server';
import type { customsearch_v1 } from 'googleapis';
import { google } from 'googleapis';

export async function fetchCustomSearch(
  query: string
): Promise<customsearch_v1.Schema$Result[]> {
  const enableCustomSearch = process.env.ENABLE_GOOGLE_CSE === 'false';
  // If custom search is disabled, return an empty array.
  if (enableCustomSearch) {
    return [];
  } else {
    // Create a new custom search client and load the API key.
    const customsearch = google.customsearch('v1');
    const apiKey = process.env.GOOGLE_API_KEY;

    try {
      // Fetch custom search results using the API key, custom search engine ID, and query.
      // Limits the number of results to 3.
      const response = await customsearch.cse.list({
        auth: apiKey,
        cx: process.env.GOOGLE_CSE_CX,
        q: query,
        num: 3,
      });

      // If a response is returned, reformat and return the data.
      if (response.data.items) {
        return response.data.items.map((item) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
        }));
      } else {
        // If no response is returned, return an empty array.
        return [];
      }
    } catch (error) {
      // Log the error and return an empty array.
      console.error('Error fetching custom search:', error);
      return [];
    }
  }
}
