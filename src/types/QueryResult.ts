/**
 * Defines a template for a structed result element to be returned by functions.
 * Standardizes information about the result of function calls and passes relevant error information.
 */

export type QueryResult = {
  // 'Success' or 'Error';
  result: string;
  // A message that indicates the Result of the Query.
  // Primarily for error logging.
  message: string;
  // Any details related to the Result of the Query.
  // Should only be logged internally.
  detail: string;
};
