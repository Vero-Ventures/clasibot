/**
 * The default Error response from the QBO API.
 * Part of Error checking on most QuickBooks requests.
 */

export type ErrorResponse = {
  Fault: {
    Error: {
      // A short message indicating an Error.
      Message: string;
      // Detail information regarding the Error.
      Detail: string;
      // The QuickBooks backend Error code.
      code: string;
      // The QBO API element the Error occured in relation to.
      element: string;
    }[];
    // The type of Error that occurred.
    type: string;
  };
};
