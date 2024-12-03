/**
 * A formatted version of the Transaction object returned from the QuickBooks API.
 * Seperate from 'For Review' transactions.
 */

export type Transaction = {
  // Name of the Transaction (AKA payee or description).
  name: string;
  // Total positive OR negative decimal value of the Transaction.
  //    Positive vs Negative depends the type of Account the Transaction is associated with.
  amount: number;
  // Category that the Transaction is associated with.
  category: string;
  // Tax Code name extracted from the related Purchase.
  taxCodeName: string;
};
