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

// Updates the user QuickBooks account to add an  'For Review' transaction to the saved Transactions with the passed Classifications.
// Takes: An array of objects containing Raw 'For Review' transactions and the Id's of their Classifications,
//        And an array of Account Id's the 'For Review' transactions belong to.
// Returns: A Query Result for updating the User QuickBooks Transactions.
export async function addForReview(
  batchAddTransactions: {
    forReviewTransaction: RawForReviewTransaction;
    categoryId: string;
    taxCodeId: string;
  }[],
  transactionAccounts: string[]
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

    // Get the Company to check for a potential Firm name.
    // Needed during Synthetic Login if access to Company comes through an Firm.
    const currentCompany = await db
      .select()
      .from(Company)
      .where(eq(Company.realmId, session.realmId));

    // If a Company could not be found, create and return an error Query Result.
    if (!currentCompany[0]) {
      return { result: '', message: '', detail: '' };
    }

    // Call Synthetic Login with the Company realm Id and the potential Firm name.
    // Returns: A QueryResult and a Synthetic Login Tokens.
    const [loginResult, loginTokens] = await syntheticLogin(session.realmId);

    // Check if the Synthetic Login resulted in an error and return the assosiated Query Result.
    if (loginResult.result === 'Error') {
      return loginResult;
    }

    // Define the Account Id for the call and the full endpoint to use.
    const endpoint = `https://qbo.intuit.com/api/neo/v1/company/${session.realmId}/olb/ng/batchAcceptTransactions`;

    // Define static Intuit API key value.
    const apiKey = 'prdakyresxaDrhFXaSARXaUdj1S8M7h6YK7YGekc';

    // Repeat the batch add process for each Account Id.
    for (const accountId of transactionAccounts) {
      // Convert the passed 'For Review' transaction to the format needed when calling the update User Transactions endpoint.
      const body = createForReviewUpdateObject(batchAddTransactions, accountId);

      // Call the query endpoint while passing the required header cookies.
      // Pass the batch add 'For Review' transactions as the body, converted to a string.
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Intuit_APIKey intuit_apikey=${apiKey}`,
          cookie: `qbn.ticket=${loginTokens?.ticket}; qbn.agentid=${loginTokens.agentId}; qbn.authid=${loginTokens.authId}; SameSite=None;`,
        },
        body: JSON.stringify(body),
      });

      // Check if a valid response is received.
      if (!response.ok) {
        // Get the response text and return it as the detail of an error Query Result.
        const errorText = await response.text();
        return {
          result: 'Error',
          message:
            'Call made to "Add For Review" endpoint did not return a valid response.',
          detail: JSON.stringify(errorText),
        };
      }
    }

    // If the batch addition for each Account was successful, return a succes Query Result.
    return {
      result: 'Success',
      message:
        'Request made to "Add For Review" endpoint was returned with a valid response',
      detail:
        "'For Review' transactions successfully batch added to QuickBooks.",
    };
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

// Takes the array of 'For Review' transaction data and converts it to a batch add object for QuickBooks.
// Returns: An formatted batch add 'For Review' transactions.
function createForReviewUpdateObject(
  batchAddTransactions: {
    forReviewTransaction: RawForReviewTransaction;
    categoryId: string;
    taxCodeId: string;
  }[],
  accountId: string
) {
  // Define the array of 'For Review' transactions to be batch added.
  const formattedBatchAddTransactions: ClassifiedRawForReviewTransaction[] = [];

  // Iterate over the 'For Review' transactions and add the ones with a matching Account Id.
  for (const batchAddTransaction of batchAddTransactions) {
    if (batchAddTransaction.forReviewTransaction.qboAccountId === accountId) {
      formattedBatchAddTransactions.push({
        id: batchAddTransaction.forReviewTransaction.olbTxnId,
        qboAccountId: batchAddTransaction.forReviewTransaction.qboAccountId,
        description: batchAddTransaction.forReviewTransaction.description,
        origDescription:
          batchAddTransaction.forReviewTransaction.origDescription,
        amount: batchAddTransaction.forReviewTransaction.amount,
        olbTxnDate: batchAddTransaction.forReviewTransaction.olbTxnDate,
        acceptType: batchAddTransaction.forReviewTransaction.acceptType,
        addAsQboTxn: {
          details: [
            {
              categoryId: batchAddTransaction.categoryId,
              taxCodeId: batchAddTransaction.taxCodeId,
              taxApplicableOn: 'SALES',
            },
          ],
          nameId: batchAddTransaction.forReviewTransaction.addAsQboTxn.nameId
            ? batchAddTransaction.forReviewTransaction.addAsQboTxn.nameId
            : null,
          txnDate: batchAddTransaction.forReviewTransaction.olbTxnDate,
          txnTypeId:
            batchAddTransaction.forReviewTransaction.addAsQboTxn.txnTypeId,
        },
      });
    }
  }

  // Create and return an batch add object for the current Account Id using the selected 'For Review' transaction array.
  const newUpdateObject = {
    txnList: {
      olbTxns: formattedBatchAddTransactions,
    },
    nextTxnInfo: {
      accountId: accountId,
      nextTransactionIndex: -1,
      reviewState: 'PENDING',
    },
  };
  return newUpdateObject;
}
