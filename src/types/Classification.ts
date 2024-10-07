/**
 * Defines objects used in determining the classification of a 'for review' transaction.
 * Used in determining tax codes and transaction categories.
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
 */
export type ClassifiedResult = {
  // Whole number as a string.
  transaction_ID: string;
  // A list of possible categories the transaction could be classified as.
  possibleClassifications: Classification[];
  // The method of classification:
  // 'Matching', 'Database', or 'LLM'
  classifiedBy: string;
};
