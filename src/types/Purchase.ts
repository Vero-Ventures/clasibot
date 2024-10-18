/**
 * Defines a formatted version of a purchase object returned from the API.
 */

export type Purchase = {
  result_info: {
    // 'Success' or 'Error';
    result: string;
    // A message that indicates the result of the query.
    // Primarily for error logging.
    message: string;
    // Any details related to the result of the query.
    detail: string;
  };
  //  Integer as a string.
  id: string;
  // The tax code of the transaction related to the purchase.
  taxCodeId: string;
};

/**
 * Defines the data returned by the API when calling get_purchase.
 */
export type PurchaseResponse = {
  // Integer as a string.
  Id: string;
  // Integer as a string used for purchase updating.
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
        // AccountRef: Defines the account for that transaction.
        //    value: Id of the connected account (integer as a string).
        //    name: Name of the connected account.
        AccountRef: { value: string; name: string };
        // TaxCodeRef: Defines the tax code for that transaction.
        //    value: Id of the connected tax code (integer as a string).
        //    name: An optional identifing name for the connected tax code.
        TaxCodeRef: { value: string; name: string };
      };
    },
  ];
  // Potential error returned by the API.
  //    Message: Error message.
  //    Detail: Error details.
  Error: { Message: string; Detail: string }[];
};
