/**
 * A formatted version of the Account data returned from the QuickBooks API.
 */

export type Account = {
  // QuickBooks internal Id.
  id: string;
  // Name of the Account.
  name: string;
  // Whether the Account is active.
  active: boolean;
  // Defines the higher level Classification of the Account.
  // Used to identify 'Expense' Accounts.
  classification: string;
  // 'Expense': Defines what Category a Transaction in that Account is Classified as.
  // 'Transaction': Determines if the Account may contain 'For Review' transactions.
  account_sub_type: string;
};
