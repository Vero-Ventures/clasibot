'use server';
import type { Classification } from '@/types/Classification';
import { db } from '@/db/index';
import {
  Transaction,
  TransactionsToCategories,
  Category,
  TaxCode,
  TransactionsToTaxCodes,
} from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getTopCategoriesForTransaction(
  name: string,
  validCategories: Classification[]
): Promise<{ id: string; name: string }[]> {
  try {
    // Find any transaction with the passed name.
    const transaction = await db
      .select()
      .from(Transaction)
      .where(eq(Transaction.transactionName, name));

    // Get the transaction to category relations for the transaction.
    const transactionCategories = await db
      .select()
      .from(TransactionsToCategories)
      .where(eq(TransactionsToCategories.transactionId, transaction[0].id));

    // Create an array to store the categories for the transaction.
    const categories: {
      id: number;
      category: string;
      count: number;
    }[] = [];

    // Get the categories for each relationship and add it to the categories array.
    for (const relationship of transactionCategories) {
      const category = await db
        .select()
        .from(Category)
        .where(eq(Category.id, relationship.categoryId));

      categories.push(category[0]);
    }

    // If there are no categories, return an empty array
    if (categories.length === 0) {
      return [];
    }

    // Create a dictionary that maps category names to their IDs.
    const validCategoryMap = validCategories.reduce<{ [key: string]: string }>(
      (acc, category) => {
        acc[category.name] = category.id;
        return acc;
      },
      {}
    );

    // Filter out any categories without a valid category by checking against the dictionary.
    const filteredCategories = categories.filter((category) =>
      Object.hasOwn(validCategoryMap, category.category)
    );

    // Sort the categories by count in descending order.
    // Most common categories will be sorted to the front.
    filteredCategories.sort((a, b) => b.count - a.count);

    const maxCount = 3;
    // Take the first 3 categories and return them.
    const topCategories = filteredCategories.slice(0, maxCount);

    return topCategories.map((category) => ({
      id: validCategoryMap[category.category],
      name: category.category,
    }));
  } catch (error) {
    // Catch any errors, log them, and return an empty array.
    console.error('Error searching the database:', error);
    return [];
  }
}

export async function getTopTaxCodesForTransaction(
  name: string,
  validTaxCodes: Classification[]
): Promise<{ id: string; name: string }[]> {
  try {
    // Find any transaction with the passed name.
    const transaction = await db
      .select()
      .from(Transaction)
      .where(eq(Transaction.transactionName, name));

    // Get the transaction to tax codes relations for the transaction.
    const transactionTaxCodes = await db
      .select()
      .from(TransactionsToTaxCodes)
      .where(eq(TransactionsToTaxCodes.transactionId, transaction[0].id));

    // Create an array to store the tax codes for the transaction.
    const taxCodes: {
      id: number;
      taxCode: string;
      count: number;
    }[] = [];

    // Get the tax code for each relationship by its ID and add it to the tax codes array.
    for (const relationship of transactionTaxCodes) {
      const taxCode = await db
        .select()
        .from(TaxCode)
        .where(eq(TaxCode.id, relationship.transactionId));

      taxCodes.push(taxCode[0]);
    }

    // If there are no tax codes, return an empty array
    if (taxCodes.length === 0) {
      return [];
    }

    // Create a dictionary that maps tax code names to their IDs.
    const validTaxCodeMap = validTaxCodes.reduce<{ [key: string]: string }>(
      (acc, taxCode) => {
        acc[taxCode.name] = taxCode.id;
        return acc;
      },
      {}
    );

    // Filter out any tax codes without a valid name by checking against the dictionary.
    const filtedTaxCodes = taxCodes.filter((taxCode) =>
      Object.hasOwn(validTaxCodeMap, taxCode.taxCode)
    );

    // Sort the tax codes by count in descending order.
    // Most common tax codes will be sorted to the front.
    filtedTaxCodes.sort((a, b) => b.count - a.count);

    const maxCount = 3;
    // Take the first 3 tax codes and return them.
    const topTaxCodes = filtedTaxCodes.slice(0, maxCount);

    return topTaxCodes.map((taxCode) => ({
      id: validTaxCodeMap[taxCode.taxCode],
      name: taxCode.taxCode,
    }));
  } catch (error) {
    // Catch any errors, log them, and return an empty array.
    console.error('Error searching the database:', error);
    return [];
  }
}