/**
 * The default error response from the QBO API.
 */
export type ErrorResponse = {
  Fault: {
    Error: {
        // Message: A short message indicating an error.
      Message: string;
      // Detail: Detail information regarding the error.
      Detail: string;
      // code: The QuickBooks backend error code.
      code: string;
      // Element: The QBO API element the error occured in relation to.
      element: string;
    }[];
    // type: The type of error that occurred.
    type: string;
  };
};
