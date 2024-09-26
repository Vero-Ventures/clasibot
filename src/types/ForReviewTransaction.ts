/**
 * Defines a formatted version of a "for review" transaction returned from the API.
 */

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
  };
};

export type FormattedForReviewTransaction = {
  // Name related to the transaction (e.g. the payee).
  name: string;
  // date: Date as a string in the format 'YYYY-MM-DD'.
  date: string;
  // The account that the for review transaction was pulled from.
  account: string;
  // Total negative decimal value of the purchase.
  amount: number;
};

// Defines the full object needed to classify a for review transaction through the API call.
export type ForReviewTransactionUpdateObject = {
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
