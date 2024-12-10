/**
 * A formatted version of the Account object returned from the QuickBooks API.
 */

export type Account = {
  // The internal QuickBooks Id of the Classification.
  id: string;
  // The name of the Account.
  name: string;
  // If user has the Account enabled.
  active: boolean;
  // Defines the higher level Classification of the Account.
  // Used to identify 'Expense' Accounts.
  classification: string;
  // 'Expense': Defines what Category a Transaction in that Account is Classified as.
  // 'Transaction': Determines if the Account may contain 'For Review' transactions.
  account_sub_type: string;
};
