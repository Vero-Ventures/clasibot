/**
 * The default error response from the QBO API.
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
