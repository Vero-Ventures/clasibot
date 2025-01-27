'use server';

import type {
  RawForReviewTransaction,
  FormattedForReviewTransaction,
  LoginTokens,
  QueryResult,
} from '@/types/index';

// Takes: The  realm Id, Id of Account to check, and a set of Synthetic Login Tokens.
// Returns: A Query Result, on success returns the found 'For Review' transactions array as the detail.
//    Returned 'For Review' transactions are an array of Sub-arrays in the format [FormattedForReviewTransaction, ForReviewTransaction].
export async function getForReview(
  accountId: string,
  loginTokens: LoginTokens,
  realmId: string
): Promise<QueryResult> {
  try {
    // Define the endpoint using the realm Id and the Id of the Account to fetch the 'For Review' transactions from.
    const endpoint = `https://qbo.intuit.com/api/neo/v1/company/${realmId}/olb/ng/getTransactions?accountId=${accountId}&sort=-amount&reviewState=PENDING&ignoreMatching=false`;

    // Define the static Intuit API key value.
    const apiKey = 'prdakyresxaDrhFXaSARXaUdj1S8M7h6YK7YGekc';

    // Call the get 'For Review' transactions endpoint while passing the required header cookies.
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        authorization: `Intuit_APIKey intuit_apikey=${apiKey}`,
        cookie: `qbn.ticket=${loginTokens?.ticket}; qbn.agentid=${loginTokens.agentId}; qbn.authid=${loginTokens.authId};`,
      },
    });

    // Check if a valid response was received.
    if (!response.ok) {
      // On error, get the response text and return it as the detail of an error Query Result.
      const errorText = await response.text();
      return {
        result: 'Error',
        message:
          'Call made to "Get For Review" endpoint did not return a valid response.',
        detail: JSON.stringify(errorText),
      };
    }

    // Get the 'For Review' transaction data from the response and format it.
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
        detail: 'Error: ' + error.message,
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

// Take: An array of Raw 'For Review' transactions data.
// Returns: An array of Sub-arrays for the results in the format: [FormattedForReviewTransaction, ForReviewTransaction].
function formatForReviewTransaction(
  responseData: RawForReviewTransaction[]
): (FormattedForReviewTransaction | RawForReviewTransaction)[][] {
  const transactions = [];
  for (const rawTransaction of responseData) {
    // Only record expense Transactions (Negative value = money left Account).
    if (rawTransaction.amount < 0) {
      const newTransaction: FormattedForReviewTransaction = {
        transaction_Id: rawTransaction.id,
        name: rawTransaction.description,
        rawName: rawTransaction.origDescription,
        date: rawTransaction.olbTxnDate.split('T')[0],
        account: rawTransaction.qboAccountId,
        accountName: '',
        amount: rawTransaction.amount,
      };
      transactions.push([newTransaction, rawTransaction]);
    }
  }
  return transactions;
}
