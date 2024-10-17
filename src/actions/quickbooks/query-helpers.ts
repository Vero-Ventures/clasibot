import type { QueryResult } from '@/types/QueryResult';
import type { ErrorResponse } from '@/types/ErrorResponse';

// Check for fault property in error objects returned from QuickBooks calls.
export function checkFaultProperty(
  error: unknown
): error is { Fault: unknown } {
  // If an object was passed, check if it has a 'Fault' property and return result as boolean.
  if (typeof error === 'object' && error !== null) {
    return 'Fault' in error;
  }
  // If the error is not an object, return false.
  return false;
}

// Create a formatted result object based on the query results.
// Takes a boolean success indicator and the results of the query which are only checked under conditions where they are an error response.
// Returns: A Query Result object based on the passed values.
export function createQueryResult(
  success: boolean,
  results: ErrorResponse
): QueryResult {
  // Create a formatted result object with all fields set to empty.
  const QueryResult: QueryResult = {
    result: '',
    message: '',
    detail: '',
  };

  // If the query is successful, return a standardized success response.
  if (success) {
    QueryResult.result = 'Success';
    QueryResult.message = 'Objects found successfully.';
    QueryResult.detail = 'The objects were found successfully.';
  } else {
    // Otherwise, set the query result to indicate failure.
    // Set the message and detail based on values in the passed results Error Response object.
    QueryResult.result = 'Error';
    QueryResult.message = results.Fault.Error[0].Message;
    QueryResult.detail = results.Fault.Error[0].Detail;
  }

  // Return the formatted query result.
  return QueryResult;
}
