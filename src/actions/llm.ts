/**
 * This file contains the logic for querying the Language Model using the Google or OpenAI API.
 * Contains a function to test a single query as well as a function to batch test multiple queries.
 * Single query returns the response text, batch query returns a list of categorized results.
 */
'use server';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { fetchCustomSearch } from './custom-search';
import { fetchKnowledgeGraph } from './knowledge-graph';
import type { Category } from '@/types/Category';
import type { CategorizedResult } from '@/types/CategorizedResult';
import type { Transaction } from '@/types/Transaction';

// Define the AI provider and model to use.
const provider = process.env.AI_PROVIDER;

// Define the base prompt to use for the model.
const basePrompt =
  'Using only provided list of categories, What type of business expense would a transaction from "$NAME" be? Categories: $CATEGORIES';

// Define the system instructions for the model to use.
const SystemInstructions = `
  You are an assistant that provides concise answers.
  You are helping a user categorize their transaction for accountant business expenses purposes.
  Only respond with the category that best fits the transaction based on the provided description and categories.
  If no description is provided, try to use the name of the transaction to infer the category.
  If you are unsure, respond with "None" followed by just the search query to search the web.
  `;

// Define the message interface for the model with its role and and a string variable.
export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Takes a query string and a string with any context data.
export async function queryLLM(
  query: string,
  context: string
): Promise<string> {
  // Define model to use.
  let model;
  // Set the model to use based on the provider.
  if (provider === 'google') {
    // Define the Google model to use.
    model = google('models/gemini-1.5-flash');
  } else {
    // Define the OpenAI model to use.
    model = openai('gpt-3.5-turbo');
  }
  try {
    // Define the messages to send to the model.
    let messages: Message[] = [
      // Define the user role and the the content: A description using the context.
      {
        role: 'user' as const,
        content: 'Description: ' + context,
      },
      // Define another user role with the content of the query string.
      {
        role: 'user' as const,
        content: query,
      },
    ];

    // *** FLAG *** //
    // Currently an error with a mismatched model type.
    // Expects either a LanguageModelV1 but either a Google or OpenAI model is passed.

    // Await the generated text using the model, system instructions, and messages.
    let response = await generateText({
      model,
      messages,
      system: SystemInstructions,
    });

    // If the response is 'None', search the web for additional information.
    if (response.text.startsWith('None')) {
      // Extract the search query from the response and format it.
      const searchQuery = response.text.split('None')[1].trim();

      // Fetch custom search results using the search query. May also return an empty array.
      const searchResults = (await fetchCustomSearch(searchQuery)) || [];

      // Define additional information as the search results joined by a space.
      // If no results are found, uses 'No results found' instead.
      let additionalInfo = '';
      if (searchResults.length !== 0) {
        additionalInfo = searchResults
          .map((result) => result.snippet)
          .join(' ');
      }

      // If no search results are found, return an empty string.
      if (searchResults.length === 0) {
        return '';
      } else {
        // Take the messages array and add an assistant and user role to the end.
        messages = [
          ...messages,
          // Add the assistant role with the response text as content.
          {
            role: 'assistant' as const,
            content: response.text,
          },
          // Add the user role with the additional information as content.
          {
            role: 'user' as const,
            content:
              'Here is some additional information from the web: ' +
              additionalInfo,
          },
        ];

        // *** FLAG *** //
        // Currently an error with a mismatched model type.
        // Expects either a LanguageModelV1 but either a Google or OpenAI model is passed.

        // Await the new generated text using the updated messages.
        response = await generateText({
          model,
          messages,
          system: SystemInstructions,
        });

        // Return the response text.
        return response.text;
      }
    }

    // Return the response text.
    return response.text;
  } catch (error) {
    // Log any errors that occur.
    console.error('Error sending query:', error);
    return '';
  }
}

// Takes a list of transactions and categories.
export async function batchQueryLLM(
  transactions: Transaction[],
  categories: Category[]
) {
  // Define the resultScore threshold for the Knowledge Graph API.
  const threshold = 10;

  // Extract valid category names from Category objects
  const validCategoriesNames = categories.map((category) => category.name);

  // Generate a list of contexts for each transaction using the transaction name and the list of valid categories.
  const contextPromises = transactions.map(async (transaction: Transaction) => {
    const prompt = basePrompt
      .replace('$NAME', transaction.name)
      .replace('$CATEGORIES', validCategoriesNames.join(', '));

    // Fetch detailed descriptions from the Knowledge Graph API
    const kgResults = (await fetchKnowledgeGraph(transaction.name)) || [];

    // Filter descriptions to those with a resultScore above the threshold
    const descriptions = kgResults.filter(
      (result) => result.resultScore > threshold
    );

    // Define a description variable and check that the descriptions exist.
    let description;
    if (descriptions.length > 0) {
      // Use the first detailed description if it exists.
      description = descriptions[0].detailedDescription;
    } else {
      // Otherwise, use a default description.
      description = 'No description available';
    }

    // Return the transaction ID, prompt, and context.
    return {
      prompt,
      transaction_ID: transaction.transaction_ID,
      context: description,
    };
  });

  // Wait for all contexts to be generated using the above method.
  const contexts = await Promise.all(contextPromises);

  // Create a list of results for each context element.
  const results: CategorizedResult[] = [];
  // For each context, get the transaction ID, prompt, and the context..
  for (const { transaction_ID, prompt, context } of contexts) {
    // Query the Language Model for a response using the prompt and context.
    const response = await queryLLM(prompt, context);

    // Define an empty array for possible categories.
    let possibleCategories: Category[] = [];
    if (response) {
      // If a response exists convert the response to lowercase.
      const responseText = response.toLowerCase();

      // Filter the valid categories to those that are included in the response text.
      const possibleValidCategories = validCategoriesNames.filter((category) =>
        responseText.includes(category.toLowerCase())
      );

      // Map the possible valid categories to the actual categories.
      possibleCategories = possibleValidCategories.map(
        (categoryName) =>
          categories.find(
            (category) => category.name === categoryName
          ) as Category
      );
    }

    // Add the transaction ID and possible categories to the results.
    results.push({
      transaction_ID,
      possibleCategories,
      classifiedBy: 'LLM',
    });
    // Record that the transaction was classified by the LLM.
  }
  // Return the results.
  return results;
}