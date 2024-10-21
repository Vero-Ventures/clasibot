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

// Category Predictions: Base prediction and prediction for a missing industry for the user company.
const baseCategoryPrompt =
  'Using only provided list of categories, What type of business expense would a transaction from "$NAME" for "$AMOUNT" dollars by a business in the "$INDUSTRY" be? Categories: $CATEGORIES';
const noIndustyCategoryPrompt =
  'Using only provided list of categories, What type of business expense would a transaction from "$NAME" for "$AMOUNT" dollars be? Categories: $CATEGORIES';

// Tax Code Predictions: Base prediction, missing industry prediction, missing categories prediction, and missing industry + categories prediction.
const baseTaxCodePrompt =
  'Using only provided list of tax codes, What type of business expense would a transaction from "$NAME" for "$AMOUNT" dollars by a business in the "$INDUSTRY" be? The transaction took place in $LOCATION and is categorized as $CATEGORY. Tax Codes: $TAX_CODES';
const noIndustyTaxCodePrompt =
  'Using only provided list of tax codes, What type of business expense would a transaction from "$NAME" for "$AMOUNT" dollars be? The transaction took place in $LOCATION and is categorized as $CATEGORY. Tax Codes: $TAX_CODES';
const noCategoryTaxCodePrompt =
  'Using only provided list of tax codes, What type of business expense would a transaction from "$NAME" for "$AMOUNT" dollars by a business in the "$INDUSTRY" be? The transaction took place in $LOCATION. Tax Codes: $TAX_CODES';
const noCategoryAndIndustryTaxCodePrompt =
  'Using only provided list of tax codes, What type of business expense would a transaction from "$NAME" for "$AMOUNT" dollars be? The transaction took place in $LOCATION. Tax Codes: $TAX_CODES';

// Defines the system instructions for the model to use on category prediction prompts.
const CategorySystemInstructions = `
  You are an assistant that provides concise answers.
  You are helping a user categorize their transaction for accountant business expenses purposes.
  Only respond with the category that best fits the transaction based on the provided description and categories.
  If no description is provided, try to use the name of the transaction to infer the category.
  If you are unsure, respond with "None" followed by just the search query to search the web.
  `;

// Defines the system instructions for the model to use on tax code prediction prompts.
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

// Internal function used by the batch query to make the individual predictions for each passed classification.
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
      // Define the user role and the the content: A description using the defined context.
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

    // If the response is 'None', use Custom Search Engine to generate additional information.
    if (response.text.startsWith('None')) {
      // Extract the search query from the response and format it.
      const searchQuery = response.text.split('None')[1].trim();

      // Fetch custom search results using the search query, may return an empty array.
      const searchResults = (await fetchCustomSearch(searchQuery)) || [];

      // Define additional information: by joining the individual search results with a space.
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

        // Await the new generated text using the messages updated with the CSE context.
        response = await generateText({
          model,
          messages,
          system: SystemInstructions,
        });

        // Return the response text generated with the CSE context.
        return response.text;
      }
    }
    // Return the inital or updated response text generated by the model.
    return response.text;
  } catch (error) {
    // Log any errors that occur and return an empty string.
    if (error instanceof Error) {
      console.error('Error sending query to llm: ' + error);
    } else {
      console.error('Unexpected error sending query to llm.');
    }
    return '';
  }
}

// Takes an array of 'For Review' transactions to predict, a record that connects a 'For Review' transaction Id to an array of possible class classified elements, -
// An array of the possible classifications, the company info to be used as context, and the type of classification.
// Returns: An array of classified results that connect a transaction Id to its possible classifications and the classification method.
export async function batchQueryLLM(
  transactions: FormattedForReviewTransaction[],
  transactionClassifications: Record<string, ClassifiedElement[]>,
  classifications: Classification[],
  companyInfo: CompanyInfo,
  type: string
): Promise<ClassifiedResult[]> {
  try {
    // Define the resultScore threshold for the Knowledge Graph API.
    const threshold = 10;

    // Extract valid classification names from the passed classification objects.
    const validClassificationNames = classifications.map(
      (classification) => classification.name
    );

    // Define the context promises variable.
    let contextPromises;

    // Determine context promise based on classification type.
    if (type === 'category') {
      // Get the context used for a category prediction.
      contextPromises = await categoryContext(
        transactions,
        validClassificationNames,
        companyInfo,
        threshold
      );
    } else {
      contextPromises = await taxCodeContext(
        transactions,
        transactionClassifications,
        validClassificationNames,
        companyInfo,
        threshold
      );
    }

    // Wait for all contexts to be generated using the context promises generated for the 'For Review' transactions.
    const contexts = await Promise.all(contextPromises);

    // Define the system instructions based on the classification type.
    let systemInstructions;
    if (type === 'category') {
      systemInstructions = CategorySystemInstructions;
    } else {
      systemInstructions = TaxCodeSystemInstructions;
    }

    // Create an array to track the classified results and iterate through the returned contexts.
    const results: ClassifiedResult[] = [];
    for (const { transaction_ID, prompt, context } of contexts) {
      // Query the Language Model for a response using the prompt and context.
      const response = await queryLLM(prompt, context, systemInstructions);

      // Create an array to contain the possible classification and check for a response.
      let possibleClassifications: Classification[] = [];
      if (response) {
        // If a response is found, convert it to standardized case.
        const responseText = response.toLowerCase();

        // Filter the valid classifications to those that are included in the response text.
        const possibleValidclassifications = validClassificationNames.filter(
          (classification) =>
            responseText.includes(classification.toLowerCase())
        );

        // Map the possible valid classifications to the full classification objects.
        // Iterates through the names, finds the related classification object and adds it to the array with a defined type.
        possibleClassifications = possibleValidclassifications.map(
          (classificationName) =>
            classifications.find(
              (classification) => classification.name === classificationName
            ) as Classification
        );
      }

      // Take the possible classifications and push them to the array with the related 'For Review' transactions Id.
      // Also defines the classification method to be by LLM.
      results.push({
        transaction_ID,
        possibleClassifications,
        classifiedBy: 'LLM API',
      });
    }

    // Return the array of classified results for the passed 'For Review' transactions.
    return results;
  } catch (error) {
    // Catch any errors and log an error with the error message if it is present.
    if (error instanceof Error) {
      console.error('Error Using LLM Classification: ' + error.message);
    } else {
      console.error('Unexpected Error Using LLM Classification.');
    }
    // On an error, return an empty array for the predictions.
    return [];
  }
}

// Defines the context used for a category classification prediction.
// Takes the 'For Review' transactions being predicted, the array of possible classification names, the company info context, and the threshold value.
// Returns: An array of objects (per passed transaction) with the prompt, transaction Id, and prediction context.
function categoryContext(
  transactions: FormattedForReviewTransaction[],
  validClassificationNames: string[],
  companyInfo: CompanyInfo,
  threshold: number
): Promise<{
  prompt: string;
  transaction_ID: string;
  context: string;
}>[] {
  // Generates and returns the contexts for each 'For Review' transaction.
  // Uses the name, list of valid categories, and the company info for an industry.
  return transactions.map(
    async (transaction: FormattedForReviewTransaction) => {
      // Define an inital prompt assuming the industry is not present, then check if industry is valid.
      let prompt = noIndustyCategoryPrompt;

      if (companyInfo.industry !== 'None' && companyInfo.industry !== 'Error') {
        // Update the base promt to the category prompt that incudes industry and use replace to include the industry value..
        prompt = baseCategoryPrompt;
        prompt.replace('$INDUSTRY', companyInfo.industry);
      }

      // Replace the values present in all prompt types: the transaction name, its amount, and the possible classification categories.
      prompt
        .replace('$NAME', transaction.name)
        .replace('$AMOUNT', Math.abs(transaction.amount).toString())
        .replace('$CATEGORIES', validClassificationNames.join(', '));

      // Fetch detailed descriptions from the Knowledge Graph API, which returns an empty array on failure.
      const kgResults = (await fetchKnowledgeGraph(transaction.name)) || [];

      // Filter the KN descriptions to those with a resultScore (likelyhood of relevance) above the passed threshold.
      const descriptions = kgResults.filter(
        (result) => result.resultScore > threshold
      );

      // Define a description variable, then check that descriptions exist.
      let description;
      if (descriptions.length > 0) {
        // If it exists, use the first detailed description.
        description = descriptions[0].detailedDescription;
      } else {
        // If no descriptions exist, use a default description.
        description = 'No description available';
      }

      // For the current 'For Review' transaction being mapped, return the transaction ID, prompt, and context.
      return {
        prompt,
        transaction_ID: transaction.transaction_ID,
        context: description,
      };
    }
  );
}

// Defines the context used for a tax code classification prediction.
// Takes the transactions being predicted, the array of possible classification names, the company info context, and the threshold value.
function taxCodeContext(
  transactions: FormattedForReviewTransaction[],
  transactionCategories: Record<string, ClassifiedElement[]>,
  validClassificationNames: string[],
  companyInfo: CompanyInfo,
  threshold: number
): Promise<{
  prompt: string;
  transaction_ID: string;
  context: string;
}>[] {
  // Generates and returns the contexts for each 'For Review' transaction.
  // Uses the name, list of valid categories, and the company info for an industry.
  return transactions.map(
    async (transaction: FormattedForReviewTransaction) => {
      // Define an inital prompt assuming the industry amd categories are not present, then check if industry is valid.
      let prompt = noCategoryAndIndustryTaxCodePrompt;

      // Define truth values to track if the company industry and predicted categories are present.
      let industryPresent = false;
      let categoryPresent = false;

      // Set the truth values for the validity of the prediction context values.
      if (companyInfo.industry !== 'None' && companyInfo.industry !== 'Error') {
        industryPresent = true;
      }
      if (transactionCategories[transaction.transaction_ID]) {
        categoryPresent = true;
      }

      // Set prompt based on combined truth values of validity of the industry and predicted categories.
      if (industryPresent && !categoryPresent) {
        // If industry is present, but no categories, set the prompt and replace with the real values.
        prompt = noCategoryTaxCodePrompt.replace(
          '$INDUSTRY',
          companyInfo.industry
        );
      } else if (!industryPresent && categoryPresent) {
        // If categories are present, but no industry, set the prompt and replace with the real values.
        prompt = noIndustyTaxCodePrompt.replace(
          '$CATEGORY',
          transactionCategories[transaction.transaction_ID][0].name
        );
      } else if (industryPresent && categoryPresent) {
        // If both categories and industry are present, set the prompt and replace with the real values.
        prompt = baseTaxCodePrompt
          .replace('$INDUSTRY', companyInfo.industry)
          .replace(
            '$CATEGORY',
            transactionCategories[transaction.transaction_ID][0].name
          );
      }

      // Replace the values present in all prompt types: the transaction name, its amount, and the possible classification tax codes.
      prompt
        .replace('$NAME', transaction.name)
        .replace('$AMOUNT', Math.abs(transaction.amount).toString())
        .replace('$TAX_CODES', validClassificationNames.join(', '));

      // Fetch detailed descriptions from the Knowledge Graph API, which returns an empty array on failure.
      const kgResults = (await fetchKnowledgeGraph(transaction.name)) || [];

      // Filter the KN descriptions to those with a resultScore (likelyhood of relevance) above the passed threshold.
      const descriptions = kgResults.filter(
        (result) => result.resultScore > threshold
      );

      // Define a description variable, then check that descriptions exist.
      let description;
      if (descriptions.length > 0) {
        // If it exists, use the first detailed description.
        description = descriptions[0].detailedDescription;
      } else {
        // If no descriptions exist, use a default description.
        description = 'No description available';
      }

      // For the current 'For Review' transaction being mapped, return the transaction ID, prompt, and context.
      return {
        prompt,
        transaction_ID: transaction.transaction_ID,
        context: description,
      };
    }
  );
}
