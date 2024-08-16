/**
 * Defines the basic elements of a category.
 * Also defines a classified category that includes the method of classification.
 */
export type Category = {
  // id: Whole number as a string.
  id: string;
  // The name of the category.
  name: string;
};

export type ClassifiedCategory = {
  // id: Whole number as a string.
  id: string;
  // The name of the category.
  name: string;
  // The method of classification:
  // 'Matching', 'Database', or 'LLM'
  classifiedBy: string;
};
