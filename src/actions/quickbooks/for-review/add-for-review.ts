'use server';

import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

import { db } from '@/db/index';
import { Company } from '@/db/schema';
import { eq } from 'drizzle-orm';

import { syntheticLogin } from '@/actions/synthetic-login';

import type {
  RawForReviewTransaction,
  ClassifiedRawForReviewTransaction,
  QueryResult,
} from '@/types/index';

// Updates the User QuickBooks to add a 'For Review' transaction to the saved Transactions with the passed Classificaions.
// Takes: A Raw 'For Review' transaction, and the Id's of its Classificaions.
// Returns: A Query Result object for updating the User QuickBooks Transactions.
export async function addForReview(
  forReviewTransaction: RawForReviewTransaction,
  categoryId: string,
  taxCodeId: string
): Promise<QueryResult> {
  try {
    // Get the current session for the Company realm Id of the currently logged in Company.
    const session = await getServerSession(options);

    // If session or Company realm Id are not found, handle error logging, state update, and return a failure value.
    if (!session?.realmId) {
      return {
        result: 'Error',
        message: 'Unable to find Company realm Id from session.',
        detail: 'Session or realm Id could not be found.',
      };
    }

    // Get the database Company object to check for a potential Firm name.
    // Needed during synthetic login if access to Company comes through an Firm.
    const currentCompany = await db
      .select()
      .from(Company)
      .where(eq(Company.realmId, session.realmId));

    // If a database Company could not be found, create and return an error Query Result.
    if (!currentCompany[0]) {
      return { result: '', message: '', detail: '' };
    }

    // Call synthetic login with the Company realm Id and the potential Firm name.
    // Returns: A QueryResult and a synthetic Login Tokens object.
    const [loginResult, loginTokens] = await syntheticLogin(
      session.realmId,
      currentCompany[0].firmName
    );

    // Check if the synthetic login resulted in an error and return the assosiated Query Result.
    if (loginResult.result === 'Error') {
      return loginResult;
    }

    // Define the Account Id for the call and the full endpoint to use.
    const endpoint = `https://qbo.intuit.com/api/neo/v1/company/${session.realmId}/olb/ng/batchAcceptTransactions`;

    // Define static Intuit API key value.
    const apiKey = 'prdakyresxaDrhFXaSARXaUdj1S8M7h6YK7YGekc, ';

    // Convert the passed 'For Review' transaction to the format needed when calling the update User Transactions endpoint.
    const body = createForReviewUpdateObject(
      forReviewTransaction,
      categoryId,
      taxCodeId
    );

    // Call the query endpoint while passing the required header cookies.
    // Pass the 'Update For Review' transaction object as the body, converted to a string.
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Intuit_APIKey intuit_apikey=${apiKey}`,
        cookie: `qbn.tkt=${loginTokens?.ticket}; qbn.agentid=${loginTokens.agentId};  qbn.authid=${loginTokens.authId}; e`,
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
          'Call made to "Add For Review" endpoint did not return a valid response.',
        detail: JSON.stringify(errorText),
      };
    } else {
      // Get the response data and return it as the detail of a success Query Result object.
      const responseData = await response.json();
      return {
        result: 'Success',
        message:
          'Request made to "Add For Review" endpoint was returned with a valid response',
        detail: JSON.stringify(responseData),
      };
    }
  } catch (error) {
    // Catch any errors and return an error Query Result, include the error message if it is present.
    if (error instanceof Error) {
      return {
        result: 'Error',
        message: 'Call made to "Add For Review" endpoint resulted in error.',
        detail: 'Error' + error.message,
      };
    } else {
      return {
        result: 'Error',
        message: 'Call made to "Add For Review" endpoint resulted in error.',
        detail:
          'An unexpected error occured while saving Classified "For Review" transactions.',
      };
    }
  }
}

// Takes the 'For Review' transaction data, as well as the Id's for the Classificaions.
// Returns: An formatted 'Update For Review' transaction object.
function createForReviewUpdateObject(
  responseData: RawForReviewTransaction,
  categoryId: string,
  taxCodeId: string
): ClassifiedRawForReviewTransaction {
  // Create and API call body using the passed QBO entity Id's and the values in the 'For Review' transaction object.
  const newUpdateObject: ClassifiedRawForReviewTransaction = {
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