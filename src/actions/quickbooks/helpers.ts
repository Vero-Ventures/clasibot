import type { QueryResult } from '@/types/QueryResult';
import type { ErrorResponse } from '@/types/ErrorResponse';

// Check for fault property in returned error objects.
export function checkFaultProperty(
  error: unknown
): error is { Fault: unknown } {
  if (typeof error === 'object' && error !== null) {
    // If an object was passed, check if it has a 'Fault' property.
    return 'Fault' in error;
  }
  // If the error is not an object, return false.
  return false;
}

// Create a formatted result object based on the query results.
export function createQueryResult(
  success: boolean,
  results: ErrorResponse
): QueryResult {
  // Create a formatted result object with all fields set to null.
  const QueryResult: QueryResult = {
    result: '',
    message: '',
    detail: '',
  };

  if (success) {
    // Set the query result to indicate success and provide a success message and detail.
    QueryResult.result = 'Success';
    QueryResult.message = 'Accounts found successfully.';
    QueryResult.detail = 'The account objects were found successfully.';
  } else {
    // Otherwise, set the query result to indicate failure and provide a error message and detail.
    QueryResult.result = 'Error';
    QueryResult.message = results.Fault.Error[0].Message;
    QueryResult.detail = results.Fault.Error[0].Detail;
  }

  // Return the formatted query result.
  return QueryResult;
}
