/**
 * Defines several key objects needed for using ' For Review' transactions.
 *    The important data elements from the object returned by a 'For Review' query.
 *    The full data object needed to saving the Classified 'For Review' transactions.
 *    A formatted version of the 'For Review' transaction object with the values needed in Classification.
 *    A version of the formatted 'For Review' transaction object that also contains the potential Classifications.
 */

import type { ClassifiedElement } from './Classification';

// The important data elements from the object returned by a 'For Review' query.
// Contains the values needed later when saving the 'For Review' transaction to the user Account.
export type RawForReviewTransaction = {
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

// The full data object needed to save the Classified 'For Review' transactions.
// Defines the full object needed to save a Classified 'For Review' transaction through an API call.
export type ClassifiedRawForReviewTransaction = {
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
        taxApplicableOn: string;
      },
    ];
    nameId: string | null;
    txnDate: string;
    txnTypeId: string;
  };
};

// Defines the inital formatted version of a fetched 'For Review' transaction.
export type FormattedForReviewTransaction = {
  // Id for the 'For Review' transaction.
  transaction_Id: string;
  // Name related to the 'For Review' transaction (AKA the payee).
  name: string;
  // The orginal description returned by a 'For Review' transaction.
  rawName: string;
  // Date as a string in the format 'YYYY-MM-DD'.
  date: string;
  // The Account that the 'For Review' transaction was pulled from.
  account: string;
  // The name of the Account, used for table filtering on the review page.
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
  // The name of the Account, used for table filtering on the review page.
  accountName: string;
  // Total value of the Purchase as a negative decimal.
  amount: number;
  // An (potentially empty) array of possible Categories for the 'For Review' transaction to be Classified as.
  categories: ClassifiedElement[] | null;
  // A value between 0 and 3 that defines the confidence level of how the Category Classifications were made.
  categoryConfidence: number;
  // An (potentially empty) array of possible Tax Codes for the 'For Review' transaction to be Classified as.
  taxCodes: ClassifiedElement[] | null;
  // A value between 0 and 3 that defines the confidence level of how the Tax Code Classifications were made.
  taxCodeConfidence: number;
};
