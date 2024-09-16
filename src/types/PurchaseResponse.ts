/**
 * Defines the data returned by the API when calling get_purchase.
 */
export type PurchaseResponse = {
  // Id: Integer as a string.
  Id: string;
  // SyncToken: Integer as a string.
  SyncToken: string;
  // TxnDate: Date as a string in the format 'YYYY-MM-DD'.
  TxnDate: string;
  // The type of payment used for the purchase.
  // PaymentType: 'Check' | 'Cash Expense' | 'Credit Card Expense'.
  PaymentType: string;
  // Total positive OR negative decimal value of the purchase.
  // Positive vs Negative depends the type of account the purchase is associated with.
  // Happens as a result of how accounting for different account types is done.
  TotalAmt: number;
  // AccountRef: Reference to the account used to make the purchase (bank account, credit card, etc).
  //    value: Id of the account the pruchase was made by. (integer as a string).
  //    name: Name of the account the pruchase was made by.
  AccountRef: { value: string; name: string };
  // AccountRef: Reference to the vendor the purchase was made from.
  //    value: Id of the account for the vendor. (integer as a string).
  //    name: Name of the account for the vendor.
  EntityRef: { value: string; name: string; type: string };
  // An array of objects representing the lines of the purchase.
  // Happens for compiste purchases that combine multiple transactions.
  // Still exists with a single value for single transaction pruchases.
  // Key Line (AccountBasedExpenseLineDetail) may be not present.
  Line: [
    {
      // DetailType: Defines the content of the line element.
      // Only matters if it is 'AccountBasedExpenseLineDetail'.
      DetailType: string;
      // Description: A description of that part of a compisite purchase.
      Description: string;
      // Amount: Represents amount for that part of the compisite purchase.
      Amount: number;
      // AccountBasedExpenseLineDetail: Details of the account used for the purchase.
      AccountBasedExpenseLineDetail: {
        // AccountRef: Reference to the account used for the purchase.
        // Account related to the purchase defines the pruchase classification
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
