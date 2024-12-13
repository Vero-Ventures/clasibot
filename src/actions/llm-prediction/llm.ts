'use server';

import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';

import { fetchKnowledgeGraph } from './index';

import type {
  Classification,
  ClassifiedElement,
  ClassifiedResult,
  CompanyInfo,
  FormattedForReviewTransaction,
} from '@/types/index';

// Define the AI provider and model to use.
const provider = process.env.AI_PROVIDER;

// Define the base prompts and system instructions to use in different Classification processes.

//    Defines the system instructions for the model to use on Category prediction prompts.
const CategorySystemInstructions = `
  You are an assistant that provides concise answers.
  You are helping a user categorize their transaction for accountant business expenses purposes.
  Only respond with the category that best fits the transaction based on the provided description and possible categories.
  If no description is provided, try to use the name of the transaction to infer the category.
  `;

//    Category Predictions: Base prediction and prediction with a missing Company Industry.
const baseCategoryPrompt =
  'Using only values from the provided list of categories, What type of business expense would a transaction from "$NAME" for "$AMOUNT" dollars by a business in the "$INDUSTRY" be? Categories: $CATEGORIES';
const noIndustyCategoryPrompt =
  'Using only values from the provided list of categories, What type of business expense would a transaction from "$NAME" for "$AMOUNT" dollars be? Categories: $CATEGORIES';

//    Defines the system instructions for the model to use on Tax Code prediction prompts.
const TaxCodeSystemInstructions = `
You are an assistant that provides concise answers.
You are helping a user identify the tax code on their transaction for accountant business expenses purposes.
Only respond with the tax code that best fits the transaction based on the provided description and possible tax codes.
If no description is provided, try to use the name of the transaction to infer the tax code.
`;

//     Tax Code Predictions: Base prediction, missing Industry prediction, missing Categories prediction, and missing Industry & Categories prediction.
const baseTaxCodePrompt =
  'Using only values from the provided list of tax codes, What type of business expense would a transaction from "$NAME" for "$AMOUNT" dollars by a business in the "$INDUSTRY" be? The transaction took place in $LOCATION and is categorized as $CATEGORY. Tax Codes: $TAX_CODES';
const noIndustyTaxCodePrompt =
  'Using only values from the provided list of tax codes, What type of business expense would a transaction from "$NAME" for "$AMOUNT" dollars be? The transaction took place in $LOCATION and is categorized as $CATEGORY. Tax Codes: $TAX_CODES';
const noCategoryTaxCodePrompt =
  'Using only values from the provided list of tax codes, What type of business expense would a transaction from "$NAME" for "$AMOUNT" dollars by a business in the "$INDUSTRY" be? The transaction took place in $LOCATION. Tax Codes: $TAX_CODES';
const noCategoryAndIndustryTaxCodePrompt =
  'Using only values from the provided list of tax codes, What type of business expense would a transaction from "$NAME" for "$AMOUNT" dollars be? The transaction took place in $LOCATION. Tax Codes: $TAX_CODES';

// Define the message interface for the model.
export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Takes: A query, context, and system instructions string used in LLM prediction.
// Returns: The LLM prediction as string or a blank string on failure.
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
    const messages: Message[] = [
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

    // Await and return the generated text response.
    const response = await generateText({
      model,
      messages,
      system: SystemInstructions,
    });
    return response.text;
  } catch (error) {
    // Catch any errors and log them (include the error message if it is present).
    if (error instanceof Error) {
      console.error('Error sending query to llm: ' + error.message);
    } else {
      console.error('Unexpected error sending query to llm.');
    }
    // On error return an empty string.
    return '';
  }
}

// Takes: An array of 'For Review' transactions, an array of the possible Classifications,
//        A record of 'For Review' transaction Id's to arrays of possible Classified elements,
//        The Company Info to be used as context, and the type of Classification being predicted.
// Returns: An array of Classified Results connected to the passed 'For Review' transactions.
export async function batchQueryLLM(
  transactions: FormattedForReviewTransaction[],
  classifications: Classification[],
  companyInfo: CompanyInfo,
  type: string,
  predictedCategories: Record<string, ClassifiedElement[]> | null = null
): Promise<ClassifiedResult[]> {
  try {
    // Extract valid Classification names from the passed Classifications.
    const validClassificationNames = classifications.map(
      (classification) => classification.name
    );

    // Define the context promises variable and determine the value based on Classification type.
    let contextPromises;

    if (type === 'Category') {
      // Get the context used for a Category prediction.
      contextPromises = await categoryContext(
        transactions,
        validClassificationNames,
        companyInfo
      );
    } else {
      // Get the context used for Tax Code prediction.
      // Assert that the Transaction Classifications are present (Always passed on Tax Code type calls).
      contextPromises = await taxCodeContext(
        transactions,
        predictedCategories!,
        validClassificationNames,
        companyInfo
      );
    }

    // Wait for all contexts to be generated for the 'For Review' transactions using the context promises.
    const contexts = await Promise.all(contextPromises);

    // Define the system instructions based on the Classification type.
    let systemInstructions;
    if (type === 'Category') {
      systemInstructions = CategorySystemInstructions;
    } else {
      systemInstructions = TaxCodeSystemInstructions;
    }

    // Create an array to track the Classified results and iterate through the returned contexts.
    const results: ClassifiedResult[] = [];
    for (const { transaction_Id, prompt, context } of contexts) {
      // Query the Language Model using the prompt, context, and system instructions.
      const response = await queryLLM(prompt, context, systemInstructions);

      // Create an array to contain the possible Classification and check for the response.
      let possibleClassifications: Classification[] = [];
      if (response) {
        // If a response is found, convert it to standardized lower case.
        const responseText = response.toLowerCase();

        // Filter the valid Classifications to ones included in the response text.
        const possibleValidclassifications = validClassificationNames.filter(
          (classification) =>
            responseText.includes(classification.toLowerCase())
        );

        // Maps the Valid Classification names to find and add the related Classification.
        possibleClassifications = possibleValidclassifications.map(
          (classificationName) =>
            classifications.find(
              (classification) => classification.name === classificationName
            ) as Classification
        );
      }

      // Take the possible Classifications and record them with their related 'For Review' transaction's Id.
      // Also defines the Classification method to be done by LLM.
      results.push({
        transaction_Id,
        possibleClassifications,
        classifiedBy: 'LLM',
      });
    }

    // Return the array of Classified results for the 'For Review' transactions.
    return results;
  } catch (error) {
    // Catch any errors and log them (include the error message if it is present).
    if (error instanceof Error) {
      console.error('Error Using LLM Classification: ' + error.message);
    } else {
      console.error('Unexpected Error Using LLM Classification.');
    }
    // On an error, return an empty array.
    return [];
  }
}

// Take: An array of 'For Review' transactions, the possible Category names, and the Company Info context.
// Returns: An array of objects (per passed Transaction) with the prompt, Transaction Id, and prediction context.
async function categoryContext(
  transactions: FormattedForReviewTransaction[],
  validCategoryNames: string[],
  companyInfo: CompanyInfo
): Promise<
  {
    prompt: string;
    transaction_Id: string;
    context: string;
  }[]
> {
  try {
    // Generate and return the context for each 'For Review' transaction.
    const context = transactions.map(
      async (transaction: FormattedForReviewTransaction) => {
        // Define an inital prompt assuming the Industry is not present, then check if Industry is valid.
        let prompt = noIndustyCategoryPrompt;

        if (
          companyInfo.industry !== 'None' &&
          companyInfo.industry !== 'Error'
        ) {
          // Update the base prompt to the Category prompt that incudes Industry.
          prompt = baseCategoryPrompt;
          prompt.replace('$INDUSTRY', companyInfo.industry);
        }

        // Replace the values present in all prompts: the Transaction name, amount, and possible Category Classifications.
        prompt = prompt
          .replace('$NAME', transaction.name)
          .replace('$AMOUNT', Math.abs(transaction.amount).toString())
          .replace('$CATEGORIES', validCategoryNames.join(', '));

        // Fetch detailed descriptions from the Knowledge Graph API, or get an empty array on failure.
        const kgResults = await fetchKnowledgeGraph(transaction.name);

        // Filter the KN description to check if the relevance score is above the defined threshold.
        const filteredResults = kgResults.filter(
          (result) => result.relevanceScore > Number(process.env.KN_THRESHOLD)
        );

        // Define a description variable by checking if a description exists after relevance threshold filtering.
        const description =
          filteredResults.length > 0
            ? filteredResults[0].detailedDescription
            : 'No description available';

        // For the current 'For Review' transaction being mapped, return the Transaction Id, prompt, and context.
        return {
          prompt,
          transaction_Id: transaction.transaction_Id,
          context: description,
        };
      }
    );

    // Await the promises on all the 'For Review' transaction predictions and return the results.
    return await Promise.all(context);
  } catch (error) {
    // Catch any errors and log them (include the error message if it is present).
    if (error instanceof Error) {
      console.error('Error Using LLM Classification: ' + error.message);
    } else {
      console.error('Unexpected Error Using LLM Classification.');
    }
    // On an error, return an empty array.
    return [];
  }
}

// Takes: An array of'For Review' transactions, predicted Category names, possible Tax Code names, and the Company Info context.
// Returns: An array of objects (per passed Transaction) with the prompt, Transaction Id, and prediction context.
async function taxCodeContext(
  transactions: FormattedForReviewTransaction[],
  predictedCategories: Record<string, ClassifiedElement[]>,
  validTaxCodeNames: string[],
  companyInfo: CompanyInfo
): Promise<
  {
    prompt: string;
    transaction_Id: string;
    context: string;
  }[]
> {
  try {
    // Generate and return the context for each 'For Review' transaction.
    const context = transactions.map(
      async (transaction: FormattedForReviewTransaction) => {
        // Define an inital prompt assuming the Industry and Categories are not present.
        let prompt = noCategoryAndIndustryTaxCodePrompt;

        // Define truth values to track if the Company Industry and predicted Categories are present.
        let industryPresent = false;
        let categoryPresent = false;

        // Set the truth values for the presence of the Industry and Categories context values.
        if (
          companyInfo.industry !== 'None' &&
          companyInfo.industry !== 'Error'
        ) {
          industryPresent = true;
        }
        if (predictedCategories[transaction.transaction_Id]) {
          categoryPresent = true;
        }

        // Set prompt based on combined truth values of presence of the Industry and predicted Categories.
        if (industryPresent && !categoryPresent) {
          // If Industry is present, but no Categories, set the prompt and update it with the real Industry.
          prompt = noCategoryTaxCodePrompt.replace(
            '$INDUSTRY',
            companyInfo.industry
          );
        } else if (!industryPresent && categoryPresent) {
          // If predicted Categories are present, but no Industry, set the prompt and update it with the real Predicted Category.
          prompt = noIndustyTaxCodePrompt.replace(
            '$CATEGORY',
            predictedCategories[transaction.transaction_Id][0].name
          );
        } else if (industryPresent && categoryPresent) {
          // If both Categories and Industry are present, set the prompt and update it with the real values.
          prompt = baseTaxCodePrompt
            .replace('$INDUSTRY', companyInfo.industry)
            .replace(
              '$CATEGORY',
              predictedCategories[transaction.transaction_Id][0].name
            );
        }

        // Update the promt to include the values present in all prompts: the Transaction name, amount, and the possible Tax Code Classifications.
        prompt = prompt
          .replace('$NAME', transaction.name)
          .replace('$AMOUNT', Math.abs(transaction.amount).toString())
          .replace('$TAX_CODES', validTaxCodeNames.join(', '));

        // Fetch detailed descriptions from the Knowledge Graph API, or get an empty array on failure.
        const kgResults = (await fetchKnowledgeGraph(transaction.name)) || [];

        // Filter the KN description to check if the relevance score is above the defined threshold.
        const filteredResults = kgResults.filter(
          (result) => result.relevanceScore > Number(process.env.KN_THRESHOLD)
        );

        // Define a description variable by checking if a description exists after relevance threshold filtering.
        const description =
          filteredResults.length > 0
            ? filteredResults[0].detailedDescription
            : 'No description available';

        // For the current 'For Review' transaction being mapped, return the Transaction Id, prompt, and context.
        return {
          prompt,
          transaction_Id: transaction.transaction_Id,
          context: description,
        };
      }
    );
    // Await the promises on all the 'For Review' transaction predictions and return the results.
    return await Promise.all(context);
  } catch (error) {
    // Catch any errors and log them (include the error message if it is present).
    if (error instanceof Error) {
      console.error('Error Using LLM Classification: ' + error.message);
    } else {
      console.error('Unexpected Error Using LLM Classification.');
    }
    // On an error, return an empty array.
    return [];
  }
}
