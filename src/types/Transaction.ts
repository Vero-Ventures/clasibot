/**
 * Defines a formatted version of a transaction returned from the API.
 * Also defines a categorized version with an array of possible categories.
 */
import type { ClassifiedCategory } from './Category';

export type Transaction = {
  // transaction_ID: Integer as a string.
  transaction_ID: string;
  // Name related to the transaction (e.g. the payee).
  name: string;
  // date: Date as a string in the format 'YYYY-MM-DD'.
  date: string;
  // The account that made the payment for the transaction.
  // Bank accounts, credit cards, etc.
  account: string;
  // Total positive OR negative decimal value of the purchase.
  // Positive vs Negative depends the type of account the purchase is associated with.
  // Happens as a result of how accounting for different account types is done.
  amount: number;
  // The category that the transaction is associated with.
  category: string;
};

export type CategorizedTransaction = Omit<Transaction, 'category'> & {
  // An array of category objects:
  //    The identified categories the transaction could be classified as.
  categories: ClassifiedCategory[];
};
