/**
 * Defines a formatted version of a for review transaction returned from the API.
 */
export type FormattedForReviewTransaction = {
  // transaction_ID: String comprised of an integer followed by :ofx.
  transaction_ID: string;
  // Name related to the transaction (e.g. the payee).
  name: string;
  // date: Date as a string in the format 'YYYY-MM-DD'.
  date: string;
  // The account that the for review transaction was pulled from.
  account: string;
  // Total negative decimal value of the purchase.
  amount: number;
};
