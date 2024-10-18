/**
 * The default error response from the QBO API.
 * Used to check if a failed QBO API request was successful in reaching QuickBooks.
 * Part of error checking on most QuickBooks requests.
 */

export type ErrorResponse = {
  Fault: {
    Error: {
      // A short message indicating an error.
      Message: string;
      // Detail information regarding the error.
      Detail: string;
      // The QuickBooks backend error code.
      code: string;
      // The QBO API element the error occured in relation to.
      element: string;
    }[];
    // The type of error that occurred.
    type: string;
  };
};
