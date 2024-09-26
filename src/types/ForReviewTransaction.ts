/**
 * Defines a formatted version of a "for review" transaction returned from the API.
 */

export type ForReviewTransaction = {
  id: string;
  origDescription: string;
  olbTxnDate: string;
  qboAccountId: string;
  acceptType: string;
  creditCardPayment: boolean;
  transfer: boolean;
  amount: number
  openBalance: number
  olbTxnId: string;
  description: string;
  addAsQboTxn: {
    nameTypeId: number;
    createName: boolean;
    createAccount: boolean;
    txnTypeId: string;
    txnFdmName: string;
    currencyType: {
      isoCode: string;
      displayName: string;
      symbol: string;
    };
    details: [{ categoryId: string }];
  };
  suggestionConfidence: string;
  linkedTxns: [];
  mapOfAccounts: null;
  categorySource: string;
  payeeSource: string;
  categoryAlternativeIds: [string];
  addMatchType: string;
  matchTransactionsMap: null;
  originalCategoryId: string;
  categoryConfidenceScore: number
  userDeleted: boolean;
  olbAccountId: number
  olbSessionId: number
  catMerchantId: number
  merchantName: string;
  complexTransactionScore: number
  lowContext: boolean;
  isHighConfidenceAdd: boolean;
  scheduleCId: string;
  complexTransaction: boolean;
  fitxnId: string;
  fdptransactionId: string;
};

export type FormattedForReviewTransaction = {
  // transaction_ID: String comprised of an integer followed by :ofx.
  transaction_ID: string;
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
  nextTxnInfo: {
    accountId: string;
    nextTransactionIndex: number;
    reviewState: string;
    sort: string;
  };
  txnList: {
    olbTxns: [
      {
        id: string;
        description: string;
        linkedTxns: [];
        origDescription: string;
        amount: number;
        addMatchType: string;
        categoryConfidenceScore: number;
        categorySource: string;
        payeeSource: string;
        fdptransactionId: string;
        fitxnId: string;
        mapOfAccounts: null;
        olbTxnId: string;
        openBalance: string;
        originalCategoryId: string;
        suggestionConfidence: string;
        trackingInfo: {
          initialCategoryId: string;
          initialPayeeId: string;
          weChangedCatForUser: boolean;
          userChangedCat: boolean;
          userOverrodeChangedCat: boolean;
          userChangedName: boolean;
          isCatChanged: boolean;
        };
        olbTxnDate: string;
        addAsQboTxn: {
          details: [
            {
              categoryId: string;
              billable: boolean;
              amount: string;
              taxCodeId: string;
              taxApplicableOn: string;
            },
          ];
          attachments: [];
          nameId: string;
          txnDate: string;
          txnTypeId: string;
        };
        attachmentIds: [];
        docs: [];
        creditCardPayment: boolean;
        qboAccountId: string;
        acceptType: string;
        transfer: boolean;
      },
    ];
  };
};
