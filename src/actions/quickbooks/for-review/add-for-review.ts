'use server';

import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

import { syntheticLogin } from '@/actions/synthetic-login';

import type {
  ClassifiedRawForReviewTransaction,
  RawForReviewTransaction,
  QueryResult,
} from '@/types/index';

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
    // Get the current session for the realm Id of the currently logged in Company.
    const session = await getServerSession(options);

    // If session or realm Id are not found return an error Query Result.
    if (!session?.realmId) {
      return {
        result: 'Error',
        message: 'Unable to find realm Id from session.',
        detail: 'Session Or Realm Id Could Not Be Found.',
      };
    }

    // Call Synthetic Login with the realm Id to get the Synthetic Login Tokens.
    const [loginResult, loginTokens] = await syntheticLogin(session.realmId);

    // Check if the Synthetic Login resulted in an error Query Result and return it if it did.
    if (loginResult.result === 'Error') {
      return loginResult;
    }

    // Use the realm Id to define the call endpoint.
    const endpoint = `https://qbo.intuit.com/api/neo/v1/company/${session.realmId}/olb/ng/batchAcceptTransactions`;

    // Define the static Intuit API key value.
    const apiKey = 'prdakyresxaDrhFXaSARXaUdj1S8M7h6YK7YGekc';

    // Iterate over passed Accounts and run the batch addition process for each Account Id.
    for (const accountId of transactionAccounts) {
      // Convert the passed 'For Review' transactions to the batch addition format.
      const body = createForReviewUpdateObject(batchAddTransactions, accountId);

      // Call the batch addition endpoint while passing the required header cookies.
      // Convert the batch add 'For Review' transactions to a string and pass them as the body.
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Intuit_APIKey intuit_apikey=${apiKey}`,
          cookie: `qbn.ticket=${loginTokens?.ticket}; qbn.agentid=${loginTokens.agentId}; qbn.authid=${loginTokens.authId}; SameSite=None;`,
        },
        body: JSON.stringify(body),
      });

      // Check if a valid response was received.
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

    // If the batch addition for all the Accounts was successful, return a succes Query Result.
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
        detail: 'Error: ' + error.message,
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

// Takes: An array of objects containing Raw 'For Review' transactions and the Id's of their Classifications,
//        And the Id of the Account being saved to.
// Returns: An object used for batch adding 'For Review' transactions.
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

  // Create and return the batch addition object for the current Account Id.
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
