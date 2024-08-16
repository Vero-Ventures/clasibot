/**
 * Defines a formatted version of a account returned from the API.
 */
export type Account = {
  // id: Whole number as a string.
  id: string;
  // Name of the account
  name: string;
  // Whether the account is active.
  active: boolean;
  // Defines the higher level classification of the account.
  // classification: 'Expense'.
  classification: string;
  // Defines the specific type of expense account.
  // account_type: 'Expense' | 'Other Expense' | 'Cost of Goods Sold'.
  account_type: string;
  // Defines what category the account classifies a transaction as.
  account_sub_type: string;
};
