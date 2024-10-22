/**
 * Defines a formatted version of a saved and classified Transaction returned from the API.
 * Used in Transaction matching and creating a database of possible Classifications.
 */

export type Transaction = {
  // Name related to the Transaction (AKA the payee).
  name: string;
  // Total positive OR negative decimal value of the Transaction.
  //    Positive vs Negative depends the type of Account the transaction is associated with.
  amount: number;
  // The Category that the Transaction is associated with.
  category: string;
  // The Tax Code name extracted from the related Purchase.
  taxCodeName: string;
};
