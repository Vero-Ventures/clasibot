/**
 * Defines the data returned by the API when calling get_purchase.
 */
export type PurchaseResponse = {
  // Id: Integer as a string.
  Id: string;
  // SyncToken: Integer as a string.
  SyncToken: string;
  // PaymentType: 'Check' | 'Cash Expense' | 'Credit Card Expense'.
  PaymentType: string;
  // TxnDate: Date in the format 'YYYY-MM-DD'.
  TxnDate: string;
  // Total positive or negative decimal value of the purchase.
  TotalAmt: number;
  // AccountRef: Reference to the account used to make the purchase
  // value: Id of the account (integer as a string).
  // name: Name of the account.
  AccountRef: { value: string; name: string };
  // AccountRef: Reference to the vendor / payee the purchase was made from.
  // value: Id of the vendor account (integer as a string).
  // name: Name of the vendor account
  EntityRef: { value: string; name: string };
  // An array of objects representing the lines of the purchase.
  // Important Line (AccountBasedExpenseLineDetail) may be not present.
  Line: [
    {
      // DetailType: Defines the content of the line element.
      // Only matters if it is 'AccountBasedExpenseLineDetail'.
      DetailType: string;
      // AccountBasedExpenseLineDetail: Details of the account used for the purchase.
      AccountBasedExpenseLineDetail: {
        // AccountRef: Reference to the account used for the purchase.
        // value: Id of the account (integer as a string).
        // name: Name of the account.
        AccountRef: { value: string; name: string };
      };
    },
  ];
  // Error: Potential error returned by the API.
  // Message: Error message.
  // Detail: Error details.
  Error: { Message: string; Detail: string }[];
};
