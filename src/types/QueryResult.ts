/**
 * Defines a template for a structed element to be returned at the start of actions that use the QuickBooks API.
 * Standardizes information about the result of API calls and conveys the relevant error information
 */
export type QueryResult = {
  // 'Success' | 'Failure'.
  result: string;
  /// A message that indicates the result of the transaction.
  // Primarily for error results, statically set to on success.
  message: string;
  // A detailed message that indicates the result of the transaction.
  // Primarily for error results, statically set to on success.
  detail: string;
};
