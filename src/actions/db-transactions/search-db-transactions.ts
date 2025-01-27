'use server';

import { db } from '@/db/index';
import {
  Transaction,
  Category,
  TransactionsToCategories,
  TaxCode,
  TransactionsToTaxCodes,
} from '@/db/schema';
import { eq } from 'drizzle-orm';

import type { Classification } from '@/types/index';

// Takes: The name of the Transaction and the valid Categories for Classification.
// Returns: An array of Valid Classifications matching the Transaction name.
// Category names are filted to address naming differences from different QBO elements.
//          Classification may be 'Dues and subscriptions' but belongs to the Account 'Dues & Subscriptions'.
export async function searchDatabaseTransactionCategories(
  name: string,
  validCategories: Classification[]
): Promise<{ id: string; name: string }[]> {
  try {
    // Find the matching Transaction by the matching the passed name to the unique name value.
    const transaction = await db
      .select()
      .from(Transaction)
      .where(eq(Transaction.transactionName, name));

    // Check if a matching Transaction was found.
    if (transaction[0]) {
      // Get the Transaction to Category Relationships for the found Transaction.
      const transactionCategories = await db
        .select()
        .from(TransactionsToCategories)
        .where(eq(TransactionsToCategories.transactionId, transaction[0].id));

      // Create an array to store the Categories related to the Transaction.
      const categories: {
        id: number;
        category: string;
        matches: number;
      }[] = [];

      // For each Relationship, get the related Category and push it to the Categories array.
      for (const relationship of transactionCategories) {
        // Find and record the related Category by with unique Id from the Relationship.
        const category = await db
          .select()
          .from(Category)
          .where(eq(Category.id, relationship.categoryId));

        categories.push(category[0]);
      }

      // If no Categories are found, return an empty array.
      if (categories.length === 0) {
        return [];
      }

      let validCategoryMap: {
        [key: string]: string;
      } = {};

      if (validCategories) {
        // Create a dictionary that maps the valid Category names to their Ids.
        // Converts the names to lowercase with 'and' / '&' removed for standardization.
        validCategoryMap = validCategories.reduce<{
          [key: string]: string;
        }>((acc, category) => {
          acc[
            category.name
              .replace(/\s(&|and)\s/g, ' ')
              .trim()
              .toLowerCase()
          ] = category.id;
          return acc;
        }, {});
      }

      // Take the out any Categories that do not match to a valid Category.
      // Converts the Category names to lowercase with 'and' / '&' removed for standardization.
      const filteredCategories = categories.filter((category) =>
        Object.hasOwn(
          validCategoryMap,
          category.category
            .replace(/\s(&|and|' ')\s/g, '')
            .trim()
            .toLowerCase()
        )
      );

      // Sort the Categories by number of matches in descending order. (Most common in the first index)
      filteredCategories.sort((a, b) => b.matches - a.matches);

      // Take the top 3 (or less) Categories, map the names to their Id's and return them as an array.
      const topCategories = filteredCategories.slice(0, 3);

      // Return the Id from the valid Categories and the actual Category name.
      return topCategories.map((category) => ({
        id: validCategoryMap[
          category.category
            .replace(/\s(&|and|' ')\s/g, '')
            .trim()
            .toLowerCase()
        ],
        name: category.category,
      }));
    } else {
      // If no matching Transaction was found, return an empty array indicating there are no matches.
      return [];
    }
  } catch (error) {
    // Catch any errors and log them, include the error message if it is present.
    if (error instanceof Error) {
      console.error('Error Getting Categories From Database: ' + error.message);
    } else {
      console.error('Unexpected Error Getting Categories From Database.');
    }
    // On error, return an empty array.
    return [];
  }
}

// Takes: The name of the Transaction and the valid Tax Codes for Classification.
// Returns: An array of matching Classifications that are contained within the array of valid Tax Codes.
export async function searchDatabaseTransactionTaxCodes(
  name: string,
  validTaxCodes: Classification[]
): Promise<{ id: string; name: string }[]> {
  try {
    // Find the matching Transaction by the matching the passed name to the unique name value.
    const transaction = await db
      .select()
      .from(Transaction)
      .where(eq(Transaction.transactionName, name));

    // Check if a matching Transaction was found.
    if (transaction[0]) {
      // Get the Transaction to Tax Code Relationships for the found Transaction.
      const transactionTaxCodes = await db
        .select()
        .from(TransactionsToTaxCodes)
        .where(eq(TransactionsToTaxCodes.transactionId, transaction[0].id));

      // Create an array to store the Tax Code related to the Transaction.
      const taxCodes: {
        id: number;
        taxCode: string;
        matches: number;
      }[] = [];

      // For each Relationship, get the related Tax Code and push it to the Tax Codes array.
      for (const relationship of transactionTaxCodes) {
        // Find the related Tax Code by with unique Id from the Relationship.
        const taxCode = await db
          .select()
          .from(TaxCode)
          .where(eq(TaxCode.id, relationship.taxCodeId));

        taxCodes.push(taxCode[0]);
      }

      // If no Tax Code are found, return an empty array
      if (taxCodes.length === 0) {
        return [];
      }

      // Create a dictionary that maps the valid Tax Code names to their Ids.
      const validTaxCodeMap = validTaxCodes.reduce<{ [key: string]: string }>(
        (acc, taxCode) => {
          acc[taxCode.name] = taxCode.id;
          return acc;
        },
        {}
      );

      // Filter out any Tax Codes that do not match to a valid Tax Code.
      const filtedTaxCodes = taxCodes.filter((taxCode) =>
        Object.hasOwn(validTaxCodeMap, taxCode.taxCode)
      );

      // Sort the Tax Codes by number of matches in descending order. (Most common in the first index)
      filtedTaxCodes.sort((a, b) => b.matches - a.matches);

      // Take the top 3 (or less) Tax Codes, map the names to the Id's and return them as an array.
      const topTaxCodes = filtedTaxCodes.slice(0, 3);
      return topTaxCodes.map((taxCode) => ({
        id: validTaxCodeMap[taxCode.taxCode],
        name: taxCode.taxCode,
      }));
    } else {
      // If no matching Transaction was found, return an empty array indicating there are no matches.
      return [];
    }
  } catch (error) {
    // Catch any errors and log them, include the error message if it is present.
    if (error instanceof Error) {
      console.error('Error Getting Tax Codes From Database: ' + error.message);
    } else {
      console.error('Unexpected Error Getting Tax Codes From Database.');
    }
    // On error, return an empty array.
    return [];
  }
}
