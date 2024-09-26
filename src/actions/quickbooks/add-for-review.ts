'use server';

import type {
  ForReviewTransaction,
  ForReviewTransactionUpdateObject,
} from '@/types/ForReviewTransaction';
import type { QueryResult } from '@/types/QueryResult';

export async function addForReview(
  forReviewTransaction: ForReviewTransaction,
  classificationId: string,
  taxCodeId: string
): Promise<QueryResult> {
  try {
    // Define the account ID for the call and the full endpoint to use.
    // Each account has a different account ID and should be passed to this action when it is called.
    const endpoint = `https://c15.qbo.intuit.com/qbo15/neo/v1/company/9341452698223021/olb/ng/batchAcceptTransactions`;

    // Convert the passed ForReviewTransaction to a useable update object for the QBO API.
    const body = createForReviewUpdateObject(
      forReviewTransaction,
      classificationId,
      taxCodeId
    );

    // This is currently setup to use my actual QBO account linked to the yaniv's testing production company.
    // Will need to be updated with ENV's for the agentID and authID in the future.
    // Some method to pull ticket during login proccess will also be needed
    //    Presently it is found by logging in and sraping network traffic with mitmproxy to get it from a response header from one of QuickBooks calls.

    // Call the query endpoint while passing the defined header cookies.
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        cookie: `qbo.tkt=V1-11-B0atmppjt4lf5fnt15laho; qbo.agentid=9411821713535995; qbo.parentid=9341452698223021; qbo.authid=9341453042273832; SameSite=None`,
      },
      body: JSON.stringify(body),
    });

    // If no valid response is given, get the response text and return it in a result object with an error result.
    if (!response.ok) {
      const errorText = await response.text();
      return {
        result: 'Error',
        message:
          'Call made to Query API endpoint did not return a valid response.',
        detail: JSON.stringify(errorText),
      };
    }

    // Get the response data and return it to the caller in a result object with a success result.
    const responseData = await response.json();
    return {
      result: 'Success',
      message:
        'Request made to Query API endpoint was returned a valid response',
      detail: JSON.stringify(responseData),
    };
  } catch (error) {
    // Define a default error detail.
    let errorDetail = 'An unexpected error occured.';
    // Check if error is of type Error and update the detail if it is.
    if (error instanceof Error) {
      errorDetail = error.message;
    }
    // If there is an error calling the API, get the response error and return it in a result object with an error result.
    return {
      result: 'Error',
      message: 'Call made to Query API endpoint resulted in error.',
      detail: errorDetail,
    };
  }
}

// Takes the "for review" transaction data as well as the ID's for the classification account and tax code.
// Returns the relevant data for a "for review" transaction update as a formatted and typed object.
function createForReviewUpdateObject(
  responseData: ForReviewTransaction,
  classificationId: string,
  taxCodeId: string
): ForReviewTransactionUpdateObject {
  // Create and return the new update object using the passed QBO entity ID's and the For Review Transaction object values.
  const newUpdateObject: ForReviewTransactionUpdateObject = {
    txnList: {
      olbTxns: [
        {
          id: responseData.id,
          qboAccountId: responseData.qboAccountId,
          description: responseData.description,
          origDescription: responseData.origDescription,
          amount: responseData.amount,
          olbTxnDate: responseData.olbTxnDate,
          acceptType: responseData.acceptType,
          addAsQboTxn: {
            details: [
              {
                categoryId: classificationId,
                taxCodeId: taxCodeId,
              },
            ],
            nameId: responseData.addAsQboTxn.nameId
              ? responseData.addAsQboTxn.nameId
              : null,
            txnDate: responseData.olbTxnDate,
            txnTypeId: responseData.addAsQboTxn.txnTypeId,
          },
        },
      ],
    },
    nextTxnInfo: {
      accountId: responseData.qboAccountId,
      nextTransactionIndex: -1,
      reviewState: 'PENDING',
    },
  };
  return newUpdateObject;
}
