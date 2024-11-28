/**
 * Defines several key objects needed for using ' For Review' transactions.
 *    The key data retruned from the Query.
 *    The full data object needed in a saving a Classified 'For Review' transaction.
 *    A formatted version of the object with the values needed in Classification.
 *    A version of the formatted object that also contains the potential Classifications.
 */

import type { ClassifiedElement } from './Classification';

// Defines the object recived when calling a 'For Review' transaction from the API.
// Contains the values needed later when saving the 'For Review' transaction to the user Account.
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
    nameId: string | null;
  };
};

// Defines the full object needed to save a 'For Review' transaction through an API call.
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

// Defines the inital formatted version of a fetched 'For Review' transaction.
export type FormattedForReviewTransaction = {
  // Id for the 'For Review' transaction.
  transaction_Id: string;
  // Name related to the 'For Review' transaction (AKA the payee).
  name: string;
  // Date as a string in the format 'YYYY-MM-DD'.
  date: string;
  // The Account that the 'For Review' transaction was pulled from.
  account: string;
  // The name of the above Account, used as part of table filtering on frontend review page.
  accountName: string;
  // Total value of the Purchase as a negative decimal.
  amount: number;
};

// Defines a formatted 'For Review' transaction with its potential Classifications.
export type ClassifiedForReviewTransaction = {
  // Id for the 'For Review' transaction.
  transaction_Id: string;
  // Name related to the 'For Review' transaction (AKA the payee).
  name: string;
  // Date as a string in the format 'YYYY-MM-DD'.
  date: string;
  // The Account that the 'For Review' transaction was pulled from.
  account: string;
  // The name of the above Account, used as part of table filtering on frontend review page.
  accountName: string;
  // Total value of the Purchase as a negative decimal.
  amount: number;
  // An (potentially empty) array of possible Categories for the 'For Review' transaction to be Classified as.
  categories: ClassifiedElement[] | null;
  // A value between 0 and 3 that defines how the Category Classifications were made.
  categoryConfidence: number;
  // An (potentially empty) array of possible Tax Codes for the 'For Review' transaction to be Classified as.
  taxCodes: ClassifiedElement[] | null;
  // A value between 0 and 3 that defines how the Tax Code Classifications were made.
  taxCodeConfidence: number;
};
