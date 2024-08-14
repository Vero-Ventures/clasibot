/**
 * Defines the data returned by the API when calling get_purchase.
 */
export type PurchaseResponse = {
  // Id: Integer as a string.
  Id: string;
  // SyncToken: Integer as a string.
  SyncToken: string;
  // The type of payment used for the purchase.
  // PaymentType: 'Check' | 'Cash Expense' | 'Credit Card Expense'.
  PaymentType: string;
  // TxnDate: Date as a string in the format 'YYYY-MM-DD'.
  TxnDate: string;
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
  EntityRef: { value: string; name: string };
  // An array of objects representing the lines of the purchase.
  // Key Line (AccountBasedExpenseLineDetail) may be not present.
  Line: [
    {
      // DetailType: Defines the content of the line element.
      // Only matters if it is 'AccountBasedExpenseLineDetail'.
      DetailType: string;
      // AccountBasedExpenseLineDetail: Details of the account used for the purchase.
      AccountBasedExpenseLineDetail: {
        // AccountRef: Reference to the account used for the purchase.
        // Account related to the purchase defines the pruchase classification
        //    value: Id of the account connected to the purchase (integer as a string).
        //    name: Name of the account.
        AccountRef: { value: string; name: string };
      };
    },
  ];
  // Error: Potential error returned by the API.
  // Message: Error message.
  // Detail: Error details.
  Error: { Message: string; Detail: string }[];
};
