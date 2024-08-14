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
  // The type of payment for the purchase.
  // purchase_type: 'Check' | 'Cash Expense' | 'Credit Card Expense';
  purchase_type: string;
  // date: String in the format 'YYYY-MM-DD'.
  date: string;
  // Total positive OR negative decimal value of the purchase.
  // Positive vs Negative depends the type of account the purchase is associated with.
  // Happens as a result of how accounting for different account types is done.
  total: number;
  // The account that the purchase is associated with (bank account, credit card, etc).
  primary_account: string;
  // The name related to the purchase (the payee of the transaction).
  purchase_name: string;
  // The category that the purchase is associated with.
  // Not always present, if it is not: defined as 'None'.
  purchase_category: string;
};
