/**
 * Defines a formatted version of a transaction returned from the API.
 * Also defines a categorized version with an array of possible categories.
 */
import type { Category } from './Category';

export type Transaction = {
  // date: Date as a string in the format 'YYYY-MM-DD'.
  date: string;
  // The type of payment used for the transaction.
  // transaction_type: 'Check' | 'Cash Expense' | 'Credit Card Expense' | 'Expense';
  transaction_type: string;
  // transaction_ID: Integer as a string.
  transaction_ID: string;
  // Name related to the transaction (e.g. the payee).
  name: string;
  // The account that made the payment for the transaction.
  // Bank accounts, credit cards, etc.
  account: string;
  // The category that the transaction is associated with.
  category: string;
  // Total positive OR negative decimal value of the purchase.
  // Positive vs Negative depends the type of account the purchase is associated with.
  // Happens as a result of how accounting for different account types is done.
  amount: number;
};

export type CategorizedTransaction = Omit<Transaction, 'category'> & {
  // An array of category objects:
  //    The identified categories the transaction could be classified as.
  categories: Category[];
};
