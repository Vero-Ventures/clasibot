'use server';

import { db } from '@/db/index';
import {
  Transaction,
  TransactionsToCategories,
  Category,
  TaxCode,
  TransactionsToTaxCodes,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { Classification } from '@/types/Classification';

// Takes the name of a transaction and the valid categories for classification.
// Returns: An array of matching classifications from the database that are within the passed valid categories.
export async function getTopCategoriesForTransaction(
  name: string,
  validCategories: Classification[]
): Promise<{ id: string; name: string }[]> {
  try {
    // Find any transaction objects in the database with the passed name.
    const transaction = await db
      .select()
      .from(Transaction)
      .where(eq(Transaction.transactionName, name));

    // Check that a matching transaction could be found.
    if (transaction) {
      // Get the transaction to category relationships for the found transaction.
      const transactionCategories = await db
        .select()
        .from(TransactionsToCategories)
        .where(eq(TransactionsToCategories.transactionId, transaction[0].id));

      // Create an array to store the categories related to the transaction.
      const categories: {
        id: number;
        category: string;
        matches: number;
      }[] = [];

      // For each relationship, get the related category and push it to the categories array.
      for (const relationship of transactionCategories) {
        const category = await db
          .select()
          .from(Category)
          .where(eq(Category.id, relationship.categoryId));
        categories.push(category[0]);
      }

      // If no matching categories are found, return an empty array.
      if (categories.length === 0) {
        return [];
      }

      // Create a dictionary that maps the valid passed category names to their IDs.
      const validCategoryMap = validCategories.reduce<{
        [key: string]: string;
      }>((acc, category) => {
        acc[category.name] = category.id;
        return acc;
      }, {});

      // Take the out any matched categories that do not match to a valid category.
      const filteredCategories = categories.filter((category) =>
        Object.hasOwn(validCategoryMap, category.category)
      );

      // Sort the categories by number of matches in descending order.
      // Most common categories will be sorted to the start of the array.
      filteredCategories.sort((a, b) => b.matches - a.matches);

      // Take the top 3 (or less) categories, map the names to the Id's and return them as an array.
      const topCategories = filteredCategories.slice(0, 3);
      return topCategories.map((category) => ({
        id: validCategoryMap[category.category],
        name: category.category,
      }));
    } else {
      // If no matching transaction was found, return an empty array as there are no matches.
      return [];
    }
  } catch (error) {
    // Catch any errors, log them, and return an empty array.
    if (error instanceof Error) {
      console.log('Error Getting Categories From Database: ' + error.message);
    } else {
      console.log('Unexpected Error Getting Categories From Database.');
    }
    return [];
  }
}

export async function getTopTaxCodesForTransaction(
  name: string,
  validTaxCodes: Classification[]
): Promise<{ id: string; name: string }[]> {
  try {
    // Find any transaction objects in the database with the passed name.
    const transaction = await db
      .select()
      .from(Transaction)
      .where(eq(Transaction.transactionName, name));

    // Check that a matching transaction could be found.
    if (transaction) {
      // Get the transaction to tax codes relationships for the found transaction.
      const transactionTaxCodes = await db
        .select()
        .from(TransactionsToTaxCodes)
        .where(eq(TransactionsToTaxCodes.transactionId, transaction[0].id));

      // Create an array to store the tax codes related to the transaction.
      const taxCodes: {
        id: number;
        taxCode: string;
        matches: number;
      }[] = [];

      // For each relationship, get the related tax code and push it to the tax codes array.
      for (const relationship of transactionTaxCodes) {
        const taxCode = await db
          .select()
          .from(TaxCode)
          .where(eq(TaxCode.id, relationship.transactionId));
        taxCodes.push(taxCode[0]);
      }

      // If no matching tax codes are found, return an empty array
      if (taxCodes.length === 0) {
        return [];
      }

      // Create a dictionary that maps the valid passed category tax codes to their IDs.
      const validTaxCodeMap = validTaxCodes.reduce<{ [key: string]: string }>(
        (acc, taxCode) => {
          acc[taxCode.name] = taxCode.id;
          return acc;
        },
        {}
      );

      // Take the out any matched tax codes that do not match to a valid tax code.
      const filtedTaxCodes = taxCodes.filter((taxCode) =>
        Object.hasOwn(validTaxCodeMap, taxCode.taxCode)
      );

      // Sort the tax codes by number of matches in descending order.
      // Most common tax codes will be sorted to the start of the array.
      filtedTaxCodes.sort((a, b) => b.matches - a.matches);

      // Take the top 3 (or less) categories, map the names to the Id's and return them as an array.
      const topTaxCodes = filtedTaxCodes.slice(0, 3);
      return topTaxCodes.map((taxCode) => ({
        id: validTaxCodeMap[taxCode.taxCode],
        name: taxCode.taxCode,
      }));
    } else {
      // If no matching transaction was found, return an empty array as there are no matches.
      return [];
    }
  } catch (error) {
    // Catch any errors, log them, and return an empty array.
    if (error instanceof Error) {
      console.log('Error Getting Tax Codes From Database: ' + error.message);
    } else {
      console.log('Unexpected Error Getting Tax Codes From Database.');
    }
    return [];
  }
}
