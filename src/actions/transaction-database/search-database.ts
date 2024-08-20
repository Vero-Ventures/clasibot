'use server';
import type { Category } from '@/types/Category';
import { db } from '@/db/index';
import {
  Transaction,
  TransactionsToClassifications,
  Classification,
} from '@/db/schema';
import { eq } from 'drizzle-orm';

// Define the structure of the classification object.
interface Classification {
  category: string;
  count: number;
}

export async function getTopCategoriesForTransaction(
  name: string,
  validCategories: Category[]
): Promise<{ id: string; name: string }[]> {
  try {
    // Find any transaction with the passed name.
    const transaction = await db
      .select()
      .from(Transaction)
      .where(eq(Transaction.transactionName, name));

    // Get the transaction to classificaion relations for the transaction.
    const transactionClassifications = await db
      .select()
      .from(TransactionsToClassifications)
      .where(
        eq(TransactionsToClassifications.transactionId, transaction[0].id)
      );

    // Create an array to store the classifications for the transaction.
    const classifications: {
      id: number;
      category: string;
      count: number;
    }[] = [];

    // Get the classification for each relationship and add it to the classifications array.
    for (const relationship of transactionClassifications) {
      const classification = await db
        .select()
        .from(Classification)
        .where(eq(Classification.id, relationship.classificationId));

      classifications.push(classification[0]);
    }

    // If there are no classifications, return an empty array
    if (classifications.length === 0) {
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

    // Filter out any classifications without a valid category by checking against the dictionary.
    const filteredClassifications = classifications.filter((classification) =>
      Object.hasOwn(validCategoryMap, classification.category)
    );

    // Sort the classifications by count in descending order.
    // Most common classifications will be sorted to the top.
    filteredClassifications.sort(
      (a: Classification, b: Classification) => b.count - a.count
    );

    const maxCount = 3;
    // Take the top 3 classifications and return them.
    const topClassifications = filteredClassifications.slice(0, maxCount);

    return topClassifications.map((classification: Classification) => ({
      id: validCategoryMap[classification.category],
      name: classification.category,
    }));
  } catch (error) {
    // Catch any errors, log them, and return an empty array.
    console.error('Error searching the database:', error);
    return [];
  }
}
