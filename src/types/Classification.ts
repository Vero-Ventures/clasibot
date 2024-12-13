/**
 * Defines objects used in determining the Classification of 'For Review' transactions.
 * Used in determining the Tax Codes and Categories.
 */

// Basic Classification value that contains key values for both Classification types.
export type Classification = {
  // Either 'Category' or 'Tax Code'
  type: string;
  // The internal QuickBooks Id of the Classification.
  id: string;
  // The name of the Classification.
  name: string;
};

// Classification for a 'For Review' transaction that defines the Classification method.
export type ClassifiedElement = {
  // Either 'Category' or 'Tax Code'
  type: string;
  // The internal QuickBooks Id of the Classification.
  id: string;
  // The name of the Classification.
  name: string;
  // The method of Classification:
  // 'Matching', 'Database', or 'LLM'
  classifiedBy: string;
};

/**
 * Defines the format of the Classified result object.
 * Contains multiple Classifications that may apply to a 'For Review' transaction.
 * Defines connection to the 'For Review' transaction with the Transaction Id.
 */
export type ClassifiedResult = {
  // The internal QuickBooks Id of the Classification.
  transaction_Id: string;
  // A list of possible Classifications for the 'For Review' transaction.
  //    The type of the Classification is defined inside the Classification object.
  possibleClassifications: Classification[];
  // The method of Classification:
  // 'Matching', 'Database', or 'LLM'
  classifiedBy: string;
};
