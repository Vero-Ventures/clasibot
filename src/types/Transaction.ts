/**
 * Defines a formatted version of a transaction returned from the API.
 * Used in transaction matching and creating a DB of possible categories.
 */

export type Transaction = {
  // Name related to the transaction (e.g. the payee).
  name: string;
  // Total positive OR negative decimal value of the purchase.
  // Positive vs Negative depends the type of account the purchase is associated with.
  amount: number;
  // The category that the transaction is associated with.
  category: string;
  // The tax code ID and name extracted from the related purchase.
  taxCodeName: string;
};
