/**
 * Defines a template for a structed element to be returned at the start of actions that use the QuickBooks API.
 * It's goal is to standardize information about the result of API calls and convey relevant error information
 */
export type QueryResult = {
  // result: 'Success' | 'Failure'.
  result: string;
  /// A message that indicates the result of the transaction.
  // Primarily for error results.
  message: string;
  // A detailed message that indicates the result of the transaction.
  // Primarily for error results.
  detail: string;
};
