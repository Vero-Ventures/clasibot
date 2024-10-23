import type { ErrorResponse } from '@/types/ErrorResponse';
import type { QueryResult } from '@/types/QueryResult';

// Check for the 'Fault' property in error objects returned from QuickBooks calls.
export function checkFaultProperty(
  error: unknown
): error is { Fault: unknown } {
  // If a non-null object was passed check if it has a 'Fault' property.
  if (typeof error === 'object' && error !== null) {
    // Return the presence of the 'Fault' propertu as a boolean.
    return 'Fault' in error;
  }
  // If the error is not an object, return false.
  return false;
}

// Create a formatted result object based on the result of a function call.
// Takes a boolean success indicator and any relevant results info.
// Returns: A Query Result object created with the passed values.
export function createQueryResult(
  success: boolean,
  results: ErrorResponse
): QueryResult {
  // Create Query Result object with all fields set to empty.
  const QueryResult: QueryResult = {
    result: '',
    message: '',
    detail: '',
  };

  // If the Query was successful, return a success Query Response.
  if (success) {
    QueryResult.result = 'Success';
    QueryResult.message = 'Objects found successfully.';
    QueryResult.detail = 'The objects were found successfully.';
  } else {
    // Otherwise, set the Query Result to indicate failure.
    // Set the message and detail based on the values in the passed Error Response object.
    QueryResult.result = 'Error';
    QueryResult.message = results.Fault.Error[0].Message;
    QueryResult.detail = results.Fault.Error[0].Detail;
  }

  // Return the formatted Query Result.
  return QueryResult;
}
