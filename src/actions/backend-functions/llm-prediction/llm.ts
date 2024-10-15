'use server';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { fetchCustomSearch } from './custom-search';
import { fetchKnowledgeGraph } from './knowledge-graph';
import type {
  Classification,
  ClassifiedElement,
  ClassifiedResult,
} from '@/types/Classification';
import type { CompanyInfo } from '@/types/CompanyInfo';
import type { FormattedForReviewTransaction } from '@/types/ForReviewTransaction';

// Define the AI provider and model to use.
const provider = process.env.AI_PROVIDER;

// Define the base prompts to use in different circumstances.

// Category prediction.
const baseCategoryPrompt =
  'Using only provided list of categories, What type of business expense would a transaction from "$NAME" for "$AMOUNT" dollars by a business in the "$INDUSTRY" be? Categories: $CATEGORIES';

// Category prediction with no Industry.
const noIndustyCategoryPrompt =
  'Using only provided list of categories, What type of business expense would a transaction from "$NAME" for "$AMOUNT" dollars be? Categories: $CATEGORIES';

// Tax Code prediction.
const baseTaxCodePrompt =
  'Using only provided list of tax codes, What type of business expense would a transaction from "$NAME" for "$AMOUNT" dollars by a business in the "$INDUSTRY" be? The transaction took place in $LOCATION and is categorized as $CATEGORY. Tax Codes: $TAX_CODES';

// Tax Code prediction with no Industry.
const noIndustyTaxCodePrompt =
  'Using only provided list of tax codes, What type of business expense would a transaction from "$NAME" for "$AMOUNT" dollars be? The transaction took place in $LOCATION and is categorized as $CATEGORY. Tax Codes: $TAX_CODES';

// Tax Code prediction with no Category.
const noCategoryTaxCodePrompt =
  'Using only provided list of tax codes, What type of business expense would a transaction from "$NAME" for "$AMOUNT" dollars by a business in the "$INDUSTRY" be? The transaction took place in $LOCATION. Tax Codes: $TAX_CODES';

// Tax Code prediction with no Indsutry or Category.
const noCategoryAndIndustryTaxCodePrompt =
  'Using only provided list of tax codes, What type of business expense would a transaction from "$NAME" for "$AMOUNT" dollars be? The transaction took place in $LOCATION. Tax Codes: $TAX_CODES';

// Define the system instructions for the model to use on category prompts.
const CategorySystemInstructions = `
  You are an assistant that provides concise answers.
  You are helping a user categorize their transaction for accountant business expenses purposes.
  Only respond with the category that best fits the transaction based on the provided description and categories.
  If no description is provided, try to use the name of the transaction to infer the category.
  If you are unsure, respond with "None" followed by just the search query to search the web.
  `;

// Define the system instructions for the model to use on tax code prompts.
const TaxCodeSystemInstructions = `
You are an assistant that provides concise answers.
You are helping a user identify the tax code on their transaction for accountant business expenses purposes.
Only respond with the tax code that best fits the transaction based on the provided description and tax codes.
If no description is provided, try to use the name of the transaction to infer the tax code.
If you are unsure, respond with "None" followed by just the search query to search the web.
`;

// Define the message interface for the model with its role and and a string variable.
export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function queryLLM(
  query: string,
  context: string,
  SystemInstructions: string
): Promise<string> {
  let model;
  // Set the model to use based on the provider.
  if (provider === 'google') {
    model = google('models/gemini-1.5-flash');
  } else {
    model = openai('gpt-3.5-turbo');
  }
  try {
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

    // Await the generated text response.
    let response = await generateText({
      model,
      messages,
      system: SystemInstructions,
    });

    // If the response is 'None', search the web for additional information.
    if (response.text.startsWith('None')) {
      // Extract the search query from the response and format it.
      const searchQuery = response.text.split('None')[1].trim();

      // Fetch custom search results using the search query.
      // This may also return an empty array.
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
        // If the response is not 'None', add the assistant and user roles to the messages array.
        messages = [
          ...messages,
          {
            role: 'assistant' as const,
            content: response.text,
          },
          {
            role: 'user' as const,
            content:
              'Here is some additional information from the web: ' +
              additionalInfo,
          },
        ];

        // Await the new generated text using the updated messages.
        response = await generateText({
          model,
          messages,
          system: SystemInstructions,
        });

        // Return the response text generated either by the web search.
        return response.text;
      }
    }
    // Return the response text generated by the model.
    return response.text;
  } catch (error) {
    // Log any errors that occur and return an empty string.
    console.error('Error sending query:', error);
    return '';
  }
}

export async function batchQueryCategoriesLLM(
  transactions: FormattedForReviewTransaction[],
  classifications: Classification[],
  companyInfo: CompanyInfo
): Promise<ClassifiedResult[]> {
  try {
    // Define the resultScore threshold for the Knowledge Graph API.
    const threshold = 10;

    // Extract valid category names from Category objects
    const validCategoriesNames = classifications.map(
      (classification) => classification.name
    );

    // Generate a list of contexts for each transaction using the transaction name and the list of valid categories.
    const contextPromises = transactions.map(
      async (transaction: FormattedForReviewTransaction) => {
        // Define the prompt as having no industry, then check if industry is valid.
        let prompt = noIndustyCategoryPrompt;
        if (
          companyInfo.industry !== 'None' &&
          companyInfo.industry !== 'Error'
        ) {
          // Set prompt to use base prompt that includes industry and set the industry value.
          prompt = baseCategoryPrompt;
          prompt.replace('$INDUSTRY', companyInfo.industry);
        }
        // Replace the values present in both prompt types.
        prompt
          .replace('$NAME', transaction.name)
          .replace('$AMOUNT', Math.abs(transaction.amount).toString())
          .replace('$CATEGORIES', validCategoriesNames.join(', '));

        // Fetch detailed descriptions from the Knowledge Graph API, may return an empty array.
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
      }
    );

    // Wait for all contexts to be generated using the above method.
    const contexts = await Promise.all(contextPromises);

    const results: ClassifiedResult[] = [];
    for (const { transaction_ID, prompt, context } of contexts) {
      // Query the Language Model for a response using the prompt and context.
      const response = await queryLLM(
        prompt,
        context,
        CategorySystemInstructions
      );
      let possibleClassifications: Classification[] = [];

      if (response) {
        const responseText = response.toLowerCase();

        // Filter the valid categories to those that are included in the response text.
        const possibleValidCategories = validCategoriesNames.filter(
          (category) => responseText.includes(category.toLowerCase())
        );

        // Map the possible valid categories to the actual categories.
        possibleClassifications = possibleValidCategories.map(
          (categoryName) =>
            classifications.find(
              (classification) => classification.name === categoryName
            ) as Classification
        );
      }

      // Add the transaction ID and possible categories to the results.
      // Also record it was classified by the LLM.
      results.push({
        transaction_ID,
        possibleClassifications,
        classifiedBy: 'LLM API',
      });
    }
    // Return the results.
    return results;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error: ' + error.message);
    } else {
      console.error('Unexpected Error.');
    }
    return [];
  }
}

export async function batchQueryTaxCodesLLM(
  transactions: FormattedForReviewTransaction[],
  transactionCategories: Record<string, ClassifiedElement[]>,
  classifications: Classification[],
  companyInfo: CompanyInfo
): Promise<ClassifiedResult[]> {
  try {
    // Define the resultScore threshold for the Knowledge Graph API.
    const threshold = 10;

    // Extract valid category names from Category objects
    const validCategoriesNames = classifications.map(
      (classification) => classification.name
    );

    // Generate a list of contexts for each transaction using the transaction name and the list of valid categories.
    const contextPromises = transactions.map(
      async (transaction: FormattedForReviewTransaction) => {
        // Define the minimal value tax code prompt, then check for industry and category is valid.
        let prompt = noCategoryAndIndustryTaxCodePrompt;
        // Define values for if industry and category are present.
        let industryPresent = false;
        let categoryPresent = false;

        if (
          companyInfo.industry !== 'None' &&
          companyInfo.industry !== 'Error'
        ) {
          industryPresent = true;
        }

        if (transactionCategories[transaction.transaction_ID]) {
          categoryPresent = true;
        }

        // Set prompt based on combined industry and category values.
        if (industryPresent && !categoryPresent) {
          prompt = noCategoryTaxCodePrompt.replace(
            '$INDUSTRY',
            companyInfo.industry
          );
        } else if (!industryPresent && categoryPresent) {
          prompt = noIndustyTaxCodePrompt.replace(
            '$CATEGORY',
            transactionCategories[transaction.transaction_ID][0].name
          );
        } else if (industryPresent && categoryPresent) {
          prompt = baseTaxCodePrompt
            .replace('$INDUSTRY', companyInfo.industry)
            .replace(
              '$CATEGORY',
              transactionCategories[transaction.transaction_ID][0].name
            );
        }

        // Replace the values present in all prompt types.
        prompt
          .replace('$NAME', transaction.name)
          .replace('$AMOUNT', Math.abs(transaction.amount).toString())
          .replace('$TAX_CODES', validCategoriesNames.join(', '));

        // Fetch detailed descriptions from the Knowledge Graph API, may return an empty array.
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
      }
    );

    // Wait for all contexts to be generated using the above method.
    const contexts = await Promise.all(contextPromises);

    const results: ClassifiedResult[] = [];
    for (const { transaction_ID, prompt, context } of contexts) {
      // Query the Language Model for a response using the prompt and context.
      const response = await queryLLM(
        prompt,
        context,
        TaxCodeSystemInstructions
      );
      let possibleClassifications: Classification[] = [];

      if (response) {
        const responseText = response.toLowerCase();

        // Filter the valid categories to those that are included in the response text.
        const possibleValidCategories = validCategoriesNames.filter(
          (category) => responseText.includes(category.toLowerCase())
        );

        // Map the possible valid categories to the actual categories.
        possibleClassifications = possibleValidCategories.map(
          (categoryName) =>
            classifications.find(
              (classification) => classification.name === categoryName
            ) as Classification
        );
      }

      // Add the transaction ID and possible categories to the results.
      // Also record it was classified by the LLM.
      results.push({
        transaction_ID,
        possibleClassifications,
        classifiedBy: 'LLM API',
      });
    }
    // Return the results.
    return results;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error: ' + error.message);
    } else {
      console.error('Unexpected Error.');
    }
    return [];
  }
}
