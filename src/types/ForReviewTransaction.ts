/**
 * Defines a formatted version of a 'for review' transaction returned from the API.
 */
import type { ClassifiedElement } from './Classification';

// Defines the object recived when calling a 'for review' transaction.
// Defines the relevant values needed to later set a 'for review' transaction as a proper classified transaction.
export type ForReviewTransaction = {
  id: string;
  olbTxnId: string;
  qboAccountId: string;
  description: string;
  origDescription: string;
  amount: number;
  olbTxnDate: string;
  acceptType: string;
  addAsQboTxn: {
    txnTypeId: string;
    txnFdmName: string;
    nameId: string | null;
  };
};

// Defines the full object needed to classify a 'for review' transaction through the API call.
export type UpdatedForReviewTransaction = {
  txnList: {
    olbTxns: [
      {
        id: string;
        qboAccountId: string;
        description: string;
        origDescription: string;
        amount: number;
        olbTxnDate: string;
        acceptType: string;
        addAsQboTxn: {
          details: [
            {
              categoryId: string;
              taxCodeId: string;
            },
          ];
          nameId: string | null;
          txnDate: string;
          txnTypeId: string;
        };
      },
    ];
  };
  nextTxnInfo: {
    accountId: string;
    nextTransactionIndex: number;
    reviewState: string;
  };
};

export type FormattedForReviewTransaction = {
  // ID for the 'For Review' transaction.
  transaction_ID: string;
  // Name related to the transaction (e.g. the payee).
  name: string;
  // Date as a string in the format 'YYYY-MM-DD'.
  date: string;
  // The account that the for review transaction was pulled from.
  account: string;
  // The name of the account used in frontend filering.
  accountName: string;
  // Total negative decimal value of the purchase.
  amount: number;
};

export type ClassifiedForReviewTransaction = {
  // ID for the 'For Review' transaction.
  transaction_ID: string;
  // Name related to the transaction (e.g. the payee).
  name: string;
  // Date as a string in the format 'YYYY-MM-DD'.
  date: string;
  // The account that the for review transaction was pulled from.
  account: string;
  // The name of the account used in frontend filering.
  accountName: string;
  // Total negative decimal value of the purchase.
  amount: number;
  // An array of possible categories for the transaction to be classified as.
  categories: ClassifiedElement[] | null;
  // An array of possible tax codes for the transaction to be classified as.
  taxCodes: ClassifiedElement[] | null;
};
