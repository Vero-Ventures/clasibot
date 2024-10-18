/**
 * Defines a formatted version of an account object returned from the API.
 */

export type Account = {
  // Whole number as a string.
  id: string;
  // Name of the account
  name: string;
  // Whether the account is active.
  active: boolean;
  // Defines the higher level classification of the account.
  // Used to identify 'Expense' accounts.
  classification: string;
  // 'Expense': Defines what category a transaction in that account is classified as.
  // 'Transaction': Determines if the account may contain 'For Review' transactions.
  account_sub_type: string;
};
