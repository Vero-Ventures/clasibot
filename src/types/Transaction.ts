/**
 * Defines a formatted version of a saved and classified transaction returned from the API.
 * Used in transaction matching and creating a database of possible classifications.
 */

export type Transaction = {
  // Name related to the transaction (AKA the payee).
  name: string;
  // Total positive OR negative decimal value of the transaction.
  //    Positive vs Negative depends the type of account the transaction is associated with.
  amount: number;
  // The category that the transaction is associated with.
  category: string;
  // The tax code name extracted from the related purchase.
  taxCodeName: string;
};
