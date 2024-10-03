/**
 * Defines the basic elements of a category.
 * Also defines a classified category that includes the method of classification.
 */
export type Classification = {
  //type: Either 'category' or 'tax code'
  type: string;
  // id: Whole number as a string.
  id: string;
  // The name of the category.
  name: string;
};

export type ClassifiedElement = {
   //type: Either 'category' or 'tax code'
   type: string;
  // id: Whole number as a string.
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
  // transaction_ID: Whole number as a string.
  transaction_ID: string;
  // A list of possible categories the transaction could be classified as.
  possibleCategories: Classification[];
  // The method of classification:
  // 'Matching', 'Database', or 'LLM'
  classifiedBy: string;
};
