'use server';

import type {
  RawForReviewTransaction,
  FormattedForReviewTransaction,
  LoginTokens,
  QueryResult,
} from '@/types/index';

// Checks a specific Account of the User for 'For Review' transactions, formats and returns them.
// Takes: The Id of Account to check, a set of Synthetic Login Tokens, and the Company realm Id.
// Returns: A Query Result object with the found 'For Review' transactions in the detail field (only on success).
//    Returned 'For Review' transactions are an array of Sub-arrays in the format [FormattedForReviewTransaction, ForReviewTransaction].
export async function getForReview(
  accountId: string,
  loginTokens: LoginTokens,
  realmId: string
): Promise<QueryResult> {
  try {
    // Define the endpoint for the GET call.
    // Uses the Id of the Company and the Id of the Account to fetch the 'For Review' transactions from.
    const endpoint = `https://qbo.intuit.com/api/neo/v1/company/${realmId}/olb/ng/getTransactions?accountId=${accountId}&sort=-amount&reviewState=PENDING&ignoreMatching=false`;

    // Define static Intuit API key value.
    const apiKey = 'prdakyresxaDrhFXaSARXaUdj1S8M7h6YK7YGekc, ';

    // Call the query endpoint while passing the required header cookies.
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        authorization: `Intuit_APIKey intuit_apikey=${apiKey}`,
        cookie: `qbn.ticket=${loginTokens?.ticket}; qbn.agentid=${loginTokens.agentId};  qbn.authid=${loginTokens.authId}; e`,
      },
    });

    // Check if a valid response is received.
    if (!response.ok) {
      // Get the response text and return it as the detail of an error Query Result object.
      const errorText = await response.text();
      return {
        result: 'Error',
        message:
          'Call made to "Get For Review" endpoint did not return a valid response.',
        detail: JSON.stringify(errorText),
      };
    }

    // Get the response 'For Review' transaction data and format it.
    const responseData: {
      items: [RawForReviewTransaction];
    } = await response.json();
    const formattedResponse = formatForReviewTransaction(responseData.items);
    // Return the formatted 'For Review' transactions as the detail of a success Query Result.
    return {
      result: 'Success',
      message:
        'Request made to "Get For Review" endpoint was returned with a valid response',
      detail: JSON.stringify(formattedResponse),
    };
  } catch (error) {
    // Catch any errors and return an error Query Result, include the error message if it is present.
    if (error instanceof Error) {
      return {
        result: 'Error',
        message: 'Call made to "Get For Review" endpoint resulted in error.',
        detail: 'Error' + error.message,
      };
    } else {
      return {
        result: 'Error',
        message: 'Call made to "Get For Review" endpoint resulted in error.',
        detail:
          'An unexpected error occured while saving Classified "For Review" transactions.',
      };
    }
  }
}

// Takes Raw 'For Review' transactions, formats them and stores them in an array of Sub-arrays for each Transaction.
// Take: An array of Raw 'For Review' transactions data.
// Returns: An array of Sub-arrays for the results in the format: [FormattedForReviewTransaction, ForReviewTransaction].
function formatForReviewTransaction(
  responseData: RawForReviewTransaction[]
): (FormattedForReviewTransaction | RawForReviewTransaction)[][] {
  const transactions = [];
  for (const transactionItem of responseData) {
    // Only record expense Transactions (check that money left the Account).
    if (transactionItem.amount < 0) {
      const newTransaction: FormattedForReviewTransaction = {
        transaction_Id: transactionItem.id,
        name: transactionItem.description,
        date: transactionItem.olbTxnDate.split('T')[0],
        account: transactionItem.qboAccountId,
        accountName: '',
        amount: transactionItem.amount,
      };
      transactions.push([newTransaction, transactionItem]);
    }
  }
  return transactions;
}
