'use server';

import type { FormattedForReviewTransaction } from '@/types/ForReviewTransaction';

export async function getForReview(accountId: string) {
  try {
    // Define the parameters for the call and the full endpoint to use.
    // This will need to be run for each bank account / credit card assosiated with a user.
    // Each account has a different account ID and should be passed to this action when it is called.
    const parameters = `accountId=${accountId}&sort=-txnDate&reviewState=PENDING&ignoreMatching=false`;
    const endpoint = `https://c15.qbo.intuit.com/qbo15/neo/v1/company/9341452698223021/olb/ng/getTransactions?${parameters}`;

    // This is currently setup to use my actual QBO account linked to the yaniv's testing production company.
    // Will need to be updated with ENV's for the agentID and authID in the future.
    // Some method to pull ticket during login proccess will also be needed
    //    Presently it is found by logging in and sraping network traffic with mitmproxy to get it from a response header from one of QuickBooks calls.

    // Call the query endpoint while passing the defined header cookies.
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        cookie:
          'qbo.tkt=V1-11-B0atmppjt4lf5fnt15laho; qbo.agentid=9411821713535995; qbo.parentid=9341452698223021; qbo.authid=9341453042273832; SameSite=None',
      },
    });

    // If no valid response is given, get the response text and return it in a result object with an error result.
    if (!response.ok) {
      const errorText = await response.text();
      return Response.json({
        Result: 'Error',
        Message:
          'Call made to Query API endpoint did not return a valid response.',
        Detail: errorText,
      });
    }

    // Get the response data, format it  and return it to the caller in a result object with a success result.
    const responseData = await response.json();
    const formattedResponse = readForReviewTransaction(responseData);
    return Response.json({
      Result: 'success',
      Message:
        'Request made to Query API endpoint was returned a valid response',
      Detail: formattedResponse,
    });
  } catch (error) {
    // If there is an error calling the API, get the response error and return it in a result object with an error result.
    return Response.json({
      Result: 'Error',
      Message: 'Call made to Query API endpoint resulted in error.',
      Detail: error,
    });
  }
}

// Take for review query response data and split out the relevant data from it.
function readForReviewTransaction(responseData: {
  items: [
    {
      id: string;
      description: string;
      olbTxnDate: string;
      qboAccountId: string;
      amount: number;
    },
  ];
}): FormattedForReviewTransaction[] {
  const transactions = [];
  for (const transactionItem of responseData.items) {
    const newTransaction: FormattedForReviewTransaction = {
      transaction_ID: transactionItem.id,
      name: transactionItem.description,
      date: transactionItem.olbTxnDate.split('T')[0],
      account: transactionItem.qboAccountId,
      amount: transactionItem.amount,
    };
    transactions.push(newTransaction);
  }
  return transactions;
}
