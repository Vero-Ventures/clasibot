/**
 * Defines a template for a structed result element to be returned by functions.
 * Standardizes information about the result of API and other function calls and conveys the relevant error information.
 */

export type QueryResult = {
  // 'Success' or 'Error';
  result: string;
  // A message that indicates the result of the query.
  // Primarily for error logging.
  message: string;
  // Any details related to the result of the query.
  detail: string;
};
