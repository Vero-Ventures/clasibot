'use server';
import type {
  ForReviewTransaction,
  UpdatedForReviewTransaction,
} from '@/types/ForReviewTransaction';
import type { QueryResult } from '@/types/QueryResult';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

// Take a raw 'For Review' transaction object as well as the Id's for its category and tax code classificaions.
// Also takes the fetch and auth Id tokens generated during synthetic login.
// Returns: A Query Result object.
// Integration: Called inside iteration by review page after user selects the transactions they wish to save.
//    Requires some call to synthetic login to get the required fetch token and auth Id.
export async function addForReview(
  forReviewTransaction: ForReviewTransaction,
  categoryId: string,
  taxCodeId: string,
  fetchToken: string,
  authId: string
): Promise<QueryResult> {
  try {
    // Get the session for the current user to get their realm Id, used in the update transactions endpoint.
    const session = await getServerSession(options);

    // Define the account ID for the call and the full endpoint to use. Realm Id will always be true as function is only callable by logged in users.
    const endpoint = `https://c15.qbo.intuit.com/qbo15/neo/v1/company/${session!.realmId}/olb/ng/batchAcceptTransactions`;

    // Convert the passed ForReviewTransaction to a useable body for the calling the update transactions endpoint.
    const body = createForReviewUpdateObject(
      forReviewTransaction,
      categoryId,
      taxCodeId
    );

    // Call the query endpoint while passing the defined header cookies.
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `qbo.tkt=${fetchToken}; qbo.agentid=${process.env.BACKEND_AGENT_ID}; qbo.parentid=${session!.realmId}; qbo.authid=${authId}; SameSite=None`,
      },
      body: JSON.stringify(body),
    });

    // Check if a valid response was given.
    if (!response.ok) {
      // Get the response text and return it as the detail of an error Query Result object.
      const errorText = await response.text();
      return {
        result: 'Error',
        message:
          'Call made to Query API endpoint did not return a valid response.',
        detail: JSON.stringify(errorText),
      };
    }

    // Get the response data and return it as the detail of a success Query Result object.
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
    // Check if the caught error is of type Error and update the detail if it is.
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

// Takes the "For Review" transaction data, as well as the ID's for the classificaions.
// Returns: An object that can be used as the body when making an update transactions call to QuickBooks.
function createForReviewUpdateObject(
  responseData: ForReviewTransaction,
  categoryId: string,
  taxCodeId: string
): UpdatedForReviewTransaction {
  // Create and API call body using the passed QBO entity ID's and the values in the 'For Review' transaction object.
  const newUpdateObject: UpdatedForReviewTransaction = {
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
                categoryId: categoryId,
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
