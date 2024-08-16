'use server';
import prisma from '@/lib/db';
import type { Category } from '@/types/Category';

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
    // Find any transaction with classifications and the same name as the input.
    const transaction = await prisma.transactionClassification.findUnique({
      where: { transactionName: name },
      include: { classifications: true },
    });

    if (!transaction?.classifications) {
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

    // Filter out any classifications that don't have a valid category using the dictionary.
    const filteredClassifications = transaction.classifications.filter(
      (classification: Classification) =>
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
