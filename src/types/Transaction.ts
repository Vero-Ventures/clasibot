/**
 * Defines a formatted version of a transaction returned from the API.
 * Also defines a categorized transaction with possible categories. (Transaction with category replaced by a list of categories)
 */
import type { Category } from './Category';

export type Transaction = {
  // date: YYYY-MM-DD.
  date: string;
  // transaction_type: 'Check' | 'Cash Expense' | 'Credit Card Expense' | 'Expense';
  transaction_type: string;
  // transaction_ID: Integer as a string.
  transaction_ID: string;
  // Name related to the transaction (e.g. the payee).
  name: string;
  // The account associated with the transaction.
  account: string;
  // The category that the transaction is associated with.
  category: string;
  // Total positive or negative decimal value of the purchase.
  amount: number;
};

export type CategorizedTransaction = Omit<Transaction, 'category'> & {
  // An array of category objects representing:
  // the possible categories the transaction could be classified as.
  categories: Category[];
};
