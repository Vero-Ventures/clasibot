'use server';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import { db } from '@/db/index';
import { Company } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { syntheticLogin } from '@/actions/backend-actions/synthetic-login';
import type {
  ForReviewTransaction,
  UpdatedForReviewTransaction,
} from '@/types/ForReviewTransaction';
import type { QueryResult } from '@/types/QueryResult';

// Take a Raw 'For Review' transaction object as well as the Id's for its classificaions.
// Returns: A Query Result object.
export async function addForReview(
  forReviewTransaction: ForReviewTransaction,
  categoryId: string,
  taxCodeId: string
): Promise<QueryResult> {
  try {
    // Get the current session to get the company realm Id.
    const session = await getServerSession(options);

    // If a session realm Id could not be found, create and return an error Query Result.
    if (!session?.realmId) {
      return { result: '', message: '', detail: '' };
    }

    // Get the database Company object to check for a potential firm name.
    // Needed during synthetic login if access to Company comes through an Firm.
    const currentCompany = await db
      .select()
      .from(Company)
      .where(eq(Company.realmId, session.realmId));

    // If a database Company could not be found, create and return an error Query Result.
    if (!currentCompany[0]) {
      return { result: '', message: '', detail: '' };
    }

    // Call method for synthetic login with the realm Id of the company and the potential firm name.
    // Returns: A QueryResult and a dictionary containing the tokens from synthetic login.
    const [loginResult, loginTokens] = await syntheticLogin(
      session.realmId,
      currentCompany[0].firmName
    );

    // If the synthetic login process failed, return the assosiated failure Query Result.
    if (loginResult.result === 'Error') {
      return loginResult;
    }

    // Define the account ID for the call and the full endpoint to use.
    const endpoint = `https://c15.qbo.intuit.com/qbo15/neo/v1/company/${session!.realmId}/olb/ng/batchAcceptTransactions`;

    // Convert the passed 'For Review' transaction to the format needed when calling the update User Transactions endpoint.
    const body = createForReviewUpdateObject(
      forReviewTransaction,
      categoryId,
      taxCodeId
    );

    // Call the query endpoint while passing the required header cookies.
    // Pass the Update 'For Review' transaction object as the body, converted to a string.
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `qbo.tkt=${loginTokens.qboTicket}; qbo.agentid=${process.env.BACKEND_AGENT_ID}; qbo.parentid=${session!.realmId}; qbo.authid=${loginTokens.authId}; SameSite=None`,
      },
      body: JSON.stringify(body),
    });

    // Check if a valid response is received.
    if (!response.ok) {
      // Get the response text and return it as the detail of an error Query Result object.
      const errorText = await response.text();
      return {
        result: 'Error',
        message:
          'Call made to Add For Review endpoint did not return a valid response.',
        detail: JSON.stringify(errorText),
      };
    } else {
      // Get the response data and return it as the detail of a success Query Result object.
      const responseData = await response.json();
      return {
        result: 'Success',
        message:
          'Request made to Add For Review endpoint was returned with a valid response',
        detail: JSON.stringify(responseData),
      };
    }
  } catch (error) {
    // Catch any errors and return an appropriate error Query Result based on the caught error.
    if (error instanceof Error) {
      return {
        result: 'Error',
        message: 'Call made to Add For Review endpoint resulted in error.',
        detail: 'Error' + error.message,
      };
    } else {
      return {
        result: 'Error',
        message: 'Call made to Add For Review endpoint resulted in error.',
        detail:
          'An unexpected error occured while saving classified For Review transactions.',
      };
    }
  }
}

// Takes the "For Review" transaction data, as well as the ID's for the classificaions.
// Returns: An formatted Update 'For Review' transaction object.
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
