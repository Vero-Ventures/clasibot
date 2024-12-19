'use server';

import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

import { db } from '@/db/index';
import { ForReviewTransaction } from '@/db/schema';
import { eq } from 'drizzle-orm';

import { syntheticLogin } from '@/actions/synthetic-login';

import type { QueryResult } from '@/types/index';

// Returns: A Query Result for undoing the recently save of 'For Review' Transactions.
export async function undoForReviewSave(): Promise<QueryResult> {
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
    const endpoint = `https://qbo.intuit.com/api/neo/v1/company/${session.realmId}/olb/ng/undoTransactions`;

    // Define the static Intuit API key value.
    const apiKey = 'prdakyresxaDrhFXaSARXaUdj1S8M7h6YK7YGekc';

    // Get the bodies to call the undo endpoint with.
    const undoBodies = await createSaveUndoObjects(session.realmId);

    // Check if the bodies were created successfully.
    if (undoBodies.length > 0) {
      // Iterate over the bodies and call the undo save endpoint for each one.
      for (const body of undoBodies) {
        console.log('Add Body')
        console.log(body)

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
              'Call made to "Undo For Review Save" endpoint did not return a valid response.',
            detail: JSON.stringify(errorText),
          };
        } else {
          console.log('Add Response')
          console.log(response)
          // If the update was successful, update the related 'For Review' transactions in the database.
          updateUndoneForReviewTransactions(
            session.realmId,
            body.nextTxnInfo.accountId
          );
        }
      }
    } else {
      // If bodies were not created successfully, return an error Query Result.
      return {
        result: 'Error',
        message: 'Error While Making The Save Undo Bodies.',
        detail:
          'An unexpected error occured while creating the bodies for the undo save QuickBooks calls.',
      };
    }

    // If undoing the save for all 'For Review' transactions was successful, return a succes Query Result.
    return {
      result: 'Success',
      message:
        'Request made to "Undo For Review Save" endpoint was returned with a valid response',
      detail: "'For Review' transactions save successfully undone.",
    };
  } catch (error) {
    // Catch any errors and return an error Query Result, include the error message if it is present.
    if (error instanceof Error) {
      return {
        result: 'Error',
        message:
          'Call made to "Undo For Review Save" endpoint resulted in error.',
        detail: 'Error: ' + error.message,
      };
    } else {
      return {
        result: 'Error',
        message:
          'Call made to "Undo For Review Save" endpoint resulted in error.',
        detail:
          'An unexpected error occured while undoing the recent "For Review" transactions save.',
      };
    }
  }
}

// Define the body used in undo save calls as a typed object.
type UndoBody = {
  nextTxnInfo: {
    accountId: string;
    nextTransactionIndex: number;
    reviewState: string;
    sort: string;
  };
  txnIdList: {
    externalTxnIds: string[];
    olbTxnIds: string[];
    txnIdPairs: string[];
  };
};

// Takes: The realm Id from the current session.
// Returns: An array of objects used when calling the undo save endpoint.
async function createSaveUndoObjects(realmId: string): Promise<UndoBody[]> {
  try {
    // Get all 'For Review' transactions for the Company where recently saved is true.
    const undoTransactions = await db
      .select()
      .from(ForReviewTransaction)
      .where(
        eq(ForReviewTransaction.companyId, realmId) &&
          eq(ForReviewTransaction.recentlySaved, true)
      );

    // Define a record to relate the bodies needed for the undo calls to their Account Id.
    const undoBodies: Record<string, UndoBody> = {};

    // Define an array for Account Id's to determine if a new body should be made.
    const bodyAccounts: string[] = [];

    // Iterate over the found 'For Review' transactions to create the bodies.
    for (const undoTransaction of undoTransactions) {
      // Get the Id of the current 'For Review' transaction without the ':ofx'.
      const splitId = undoTransaction.reviewTransactionId.split(':')[0];

      // Check if an existing body exists for the Account of the current 'For Review' transaction.
      if (bodyAccounts.includes(undoTransaction.accountId)) {
        // Push the split Id to the array of Id's for the current Account.
        undoBodies[undoTransaction.accountId].txnIdList.olbTxnIds.push(splitId);
      } else {
        // If no body for the Account exists, add a new body to the array.
        // New body will contain just the Id of the current 'For Review' transaction.
        undoBodies[undoTransaction.accountId] = {
          nextTxnInfo: {
            accountId: undoTransaction.accountId,
            nextTransactionIndex: -1,
            reviewState: 'ACCEPTED',
            sort: '-description',
          },
          txnIdList: {
            externalTxnIds: [],
            olbTxnIds: [splitId],
            txnIdPairs: [],
          },
        };
      }
    }

    // Return just the bodies from the undo bodies record.
    return Object.values(undoBodies);
  } catch (error) {
    // Catch any errors and log an error, include the error message if it is present.
    if (error instanceof Error) {
      console.error(
        'Error While Making Bodies For Save Undo: ' + error.message
      );
    } else {
      console.error('Unexpected Error While Making Bodies For Save Undo.');
    }
    // Return an empty array for the bodies on failure.
    return [];
  }
}

// Takes: The realm Id and the Account Id of the 'For Review' transactions to mark as unsaved.
async function updateUndoneForReviewTransactions(
  realmId: string,
  accountId: string
): Promise<boolean> {
  try {
    // Update all 'For Review' transaction for the company with the specified Account.
    // Set the recently saved value to false due to save being undone.
    await db
      .update(ForReviewTransaction)
      .set({ recentlySaved: false })
      .where(
        eq(ForReviewTransaction.companyId, realmId) &&
          eq(ForReviewTransaction.accountId, accountId)
      );
    // If no error occurred during the update, return a success value.
    return true;
  } catch (error) {
    // Catch any errors and log an error, include the error message if it is present.
    if (error instanceof Error) {
      console.error(
        'Error While Marking Database "For Review" Transactions As Unsaved: ' +
          error.message
      );
    } else {
      console.error(
        'Unexpected Error While Marking Database "For Review" Transactions As Unsaved.'
      );
    }
    // Return an failure value.
    return false;
  }
}
