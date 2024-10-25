/**
 * Defines objects used in determining the Classification of 'For Review' transactions.
 * Used in determining the Tax Codes and Categories.
 */

export type Classification = {
  // Either 'category' or 'tax code'
  type: string;
  // QuickBooks internal Id.
  id: string;
  // The name of the Category.
  name: string;
};

export type ClassifiedElement = {
  // Either 'category' or 'tax code'
  type: string;
  //  QuickBooks internal Id.
  id: string;
  // The name of the Category.
  name: string;
  // The method of Classification:
  // 'Matching', 'Database', or 'LLM'
  classifiedBy: string;
};

/**
 * Defines the format of the Categorized result object.
 * Contains multiple Classifications that may apply to a 'For Review' transaction.
 * Defines connection to the 'For Review' transaction with the transaction Id.
 */
export type ClassifiedResult = {
  //  QuickBooks internal Id.
  transaction_Id: string;
  // A list of possible Classifications for the 'For Review' transaction.
  //    The type of the Classification is defined inside the Classification object.
  possibleClassifications: Classification[];
  // The method of Classification:
  // 'Matching', 'Database', or 'LLM'
  classifiedBy: string;
};
