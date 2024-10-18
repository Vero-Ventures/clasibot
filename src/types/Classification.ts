/**
 * Defines objects used in determining the classification of 'For Review' transactions.
 * Used in determining the transactions tax codes and categories.
 */

export type Classification = {
  // Either 'category' or 'tax code'
  type: string;
  // Whole number as a string.
  id: string;
  // The name of the category.
  name: string;
};

export type ClassifiedElement = {
  // Either 'category' or 'tax code'
  type: string;
  // Whole number as a string.
  id: string;
  // The name of the category.
  name: string;
  // The method of classification:
  // 'Matching', 'Database', or 'LLM'
  classifiedBy: string;
};

/**
 * Defines the format of the categorized result object.
 * Contains multiple classifications that may apply to the 'For Review' transaction.
 * Defines its relationship to the 'For Review' transaction by the stored transaction Id.
 */
export type ClassifiedResult = {
  // Whole number as a string.
  transaction_ID: string;
  // A list of possible classifications for the 'For Review' transaction.
  //    The type of the classification is defined inside the classification object.
  possibleClassifications: Classification[];
  // The method of classification:
  // 'Matching', 'Database', or 'LLM'
  classifiedBy: string;
};
