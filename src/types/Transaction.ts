/**
 * Defines a formatted version of the saved and Classified Transaction objects returned from the API.
 * Used in Transaction matching and creating a database of possible Classifications.
 * Seperate from 'For Review' transactions.
 */

export type Transaction = {
  // Name related to the Transaction (AKA the payee).
  name: string;
  // Total positive OR negative decimal value of the Transaction.
  //    Positive vs Negative depends the type of Account the Transaction is associated with.
  amount: number;
  // Category that the Transaction is associated with.
  category: string;
  // Tax Code name extracted from the related Purchase.
  taxCodeName: string;
};
