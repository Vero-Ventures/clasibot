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
  // purchase_type: 'Check' | 'Cash Expense' | 'Credit Card Expense';
  purchase_type: string;
  // date: YYYY-MM-DD.
  date: string;
  // Total positive or negative decimal value of the purchase.
  total: number;
  // The account that the purchase is associated with.
  primary_account: string;
  // The name related to the purchase (e.g. the payee).
  purchase_name: string;
  // The category that the purchase is associated with.
  // Not always present, will be defined as 'None' if it is not.
  purchase_category: string;
};
