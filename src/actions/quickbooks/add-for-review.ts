'use server';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import { db } from '@/db/index';
import { Company } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { syntheticLogin } from '@/actions/backend-functions/synthetic-login';
import type {
  ForReviewTransaction,
  UpdatedForReviewTransaction,
} from '@/types/ForReviewTransaction';
import type { QueryResult } from '@/types/QueryResult';

// Take a raw 'For Review' transaction object as well as the Id's for its category and tax code classificaions.
// Also takes the QBO and auth Id tokens generated during synthetic login.
// Returns: A Query Result object.
export async function addForReview(
  forReviewTransaction: ForReviewTransaction,
  categoryId: string,
  taxCodeId: string
): Promise<QueryResult> {
  try {
    // Get the current session to get the company realm Id.
    const session = await getServerSession(options);

    // If a session could not be found, create and return an error Query Result.
    if (!session?.realmId) {
      return { result: '', message: '', detail: '' };
    }

    // Get the current company from the database to check for a potential firm name.
    // Needed during synthetic login if access to company comes through an accounting firm.
    const currentCompany = await db
      .select()
      .from(Company)
      .where(eq(Company.realmId, session.realmId));

    // If a datavase company could not be found, create and return an error Query Result.
    if (!currentCompany[0]) {
      return { result: '', message: '', detail: '' };
    }

    // Call method for synthetic login.
    // Takes: the company realmId and potentially null firm name string.
    // Returns: A QueryResult, the two tokens pulled from the login response headers, and the session.
    const [loginResult, loginTokens] = await syntheticLogin(
      session.realmId,
      currentCompany[0].firmName
    );

    // If the synthetic login failed, return the assosiated failure query result.
    if (loginResult.result === 'Error') {
      return loginResult;
    }

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
        cookie: `qbo.tkt=${loginTokens.qboTicket}; qbo.agentid=${process.env.BACKEND_AGENT_ID}; qbo.parentid=${session!.realmId}; qbo.authid=${loginTokens.authId}; SameSite=None`,
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
          'Call made to Add For Review endpoint did not return a valid response.',
        detail: JSON.stringify(errorText),
      };
    }

    // Get the response data and return it as the detail of a success Query Result object.
    const responseData = await response.json();
    return {
      result: 'Success',
      message:
        'Request made to Add For Review endpoint was returned with a valid response',
      detail: JSON.stringify(responseData),
    };
  } catch (error) {
    // Define a default error detail.
    let errorDetail =
      'An unexpected error occured while saving classified For Review transactions.';
    // Check if the caught error is of type Error and update the detail if it is.
    if (error instanceof Error) {
      errorDetail = error.message;
    }
    // If there is an error calling the API, get the response error and return it in a result object with an error result.
    return {
      result: 'Error',
      message: 'Call made to Add For Review endpoint resulted in error.',
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
