/**
 * Defines a formatted version of a purchase returned from the API.
 */
export type Purchase = {
  result_info: {
    // result: 'Success' | 'Error';
    result: string;
    // A message that indicates the result of the transaction.
    // Primarily for error results.
    message: string;
    // A detailed message that indicates the result of the transaction.
    // Primarily for error results.
    detail: string;
  };
  // id: Integer as a string.
  id: string;
  // The tax code of the transaction related to the purchase.
  taxCodeId: string;
};

/**
 * Defines the data returned by the API when calling get_purchase.
 */
export type PurchaseResponse = {
  // Id: Integer as a string.
  Id: string;
  // SyncToken: Integer as a string.
  SyncToken: string;
  // The type of payment used for the purchase.
  // PaymentType: 'Check' | 'Cash' | 'Credit Card'.
  PaymentType: string;
  // An array of objects representing the lines of the purchase.
  // Exists for compiste purchases that combine multiple transactions, with all transactions containing at least one value.
  // Key detail type (AccountBasedExpenseLineDetail) may be not present, other types do not matter.
  Line: [
    {
      // DetailType: Defines the content of the line element.
      // Only matters if it is 'AccountBasedExpenseLineDetail'.
      DetailType: string;
      // AccountBasedExpenseLineDetail: Details of the account used for the purchase.
      AccountBasedExpenseLineDetail: {
        // AccountRef: Reference to the account used for the purchase.
        // Account related to the purchase defines the pruchase category
        //    value: Id of the account connected to the purchase (integer as a string).
        //    name: Name of the account.
        AccountRef: { value: string; name: string };
        // TaxCodeRef: Defines the tax code for that transaction inside a dictionary.
        //    value: the defined name of the tax code.
        //    name: an optional identifing name for the tax code.
        TaxCodeRef: { value: string; name: string };
      };
    },
  ];
  // Error: Potential error returned by the API.
  // Message: Error message.
  // Detail: Error details.
  Error: { Message: string; Detail: string }[];
};
