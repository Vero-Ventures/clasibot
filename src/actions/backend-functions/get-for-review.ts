'use server';

import type {
  ForReviewTransaction,
  FormattedForReviewTransaction,
} from '@/types/ForReviewTransaction';
import type { QueryResult } from '@/types/QueryResult';

export async function getForReview(
  accountId: string,
  companyId: string,
  fetchToken: string,
  authId: string
): Promise<QueryResult> {
  try {
    // Define the parameters for the call and the full endpoint to use.
    // Defined using the current account ID to fetch transactions for and the ID of the overall company.
    const parameters = `accountId=${accountId}&sort=-txnDate&reviewState=PENDING&ignoreMatching=false`;
    const endpoint = `https://c15.qbo.intuit.com/qbo15/neo/v1/company/${companyId}/olb/ng/getTransactions?${parameters}`;

    // Call the query endpoint while passing the defined header cookies.
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        cookie: `qbo.tkt=${fetchToken}; qbo.agentid=${process.env.BACKEND_AGENT_ID}; qbo.parentid=${companyId}; qbo.authid=${authId}; SameSite=None`,
      },
    });

    // If no valid response is given, get the response text and return it in a result object with an error result.
    if (!response.ok) {
      const errorText = await response.text();
      return {
        result: 'Error',
        message:
          'Call made to Query API endpoint did not return a valid response.',
        detail: JSON.stringify(errorText),
      };
    }

    // Get the response data, format it, and return it to the caller in a result object with a success result.
    const responseData: {
      items: [ForReviewTransaction];
    } = await response.json();
    const formattedResponse = formatForReviewTransaction(responseData.items);
    return {
      result: 'Success',
      message:
        'Request made to Query API endpoint was returned a valid response',
      detail: JSON.stringify(formattedResponse),
    };
  } catch (error) {
    // Define a default error detail.
    let errorDetail = 'An unexpected error occured.';
    // Check if error is of type Error and update the detail if it is.
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

// Take the "for review" transaction data and return the relevant data in a formatted and typed object.
function formatForReviewTransaction(
  responseData: ForReviewTransaction[]
): (FormattedForReviewTransaction | ForReviewTransaction)[][] {
  const transactions = [];
  for (const transactionItem of responseData) {
    // Only record expense (spending) transactions.
    if (transactionItem.amount < 0) {
      const newTransaction: FormattedForReviewTransaction = {
        transaction_ID: transactionItem.id,
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