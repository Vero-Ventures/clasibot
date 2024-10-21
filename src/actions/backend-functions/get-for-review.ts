'use server';
import type {
  ForReviewTransaction,
  FormattedForReviewTransaction,
} from '@/types/ForReviewTransaction';
import type { QueryResult } from '@/types/QueryResult';

// Checks a specific account of the user 'For Review' transactions, formats them and returns them.
// Takes the Id of the account to check, the Id of the user company, the fetch token and authId token pulled from synthetic login.
// Returns: A Query Result object with the found 'For Review' transactions in the detail field on success.
//    Returned transactions are an array of sub-arrays in the format [FormattedForReviewTransaction, ForReviewTransaction].
export async function getForReview(
  accountId: string,
  realmId: string,
  fetchToken: string,
  authId: string
): Promise<QueryResult> {
  try {
    // Define the parameters for the call and use them to help define the full endpoint to use.
    // Defined using the ID of the current account to fetch transactions from and the ID of the user company.
    const parameters = `accountId=${accountId}&sort=-txnDate&reviewState=PENDING&ignoreMatching=false`;
    const endpoint = `https://c15.qbo.intuit.com/qbo15/neo/v1/company/${realmId}/olb/ng/getTransactions?${parameters}`;

    // Call the query endpoint and pass the required auth cookies.
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        cookie: `qbo.tkt=${fetchToken}; qbo.agentid=${process.env.BACKEND_AGENT_ID}; qbo.parentid=${realmId}; qbo.authid=${authId}; SameSite=None`,
      },
    });

    // If no valid response is recived, get the response text and return it in an error Query Result object.
    if (!response.ok) {
      const errorText = await response.text();
      return {
        result: 'Error',
        message:
          'Call made to Get For Review endpoint did not return a valid response.',
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
        'Request made to Get For Review endpoint was returned with a valid response',
      detail: JSON.stringify(formattedResponse),
    };
  } catch (error) {
    // Define a default error detail.
    let errorDetail =
      'An unexpected error occured while getting For Review transactions.';
    // Check if error is of type Error and update the detail if it is.
    if (error instanceof Error) {
      errorDetail = error.message;
    }
    // If there is an error calling the API, get the response error and return it in a result object with an error result.
    return {
      result: 'Error',
      message: 'Call made to Get For Review endpoint resulted in error.',
      detail: 'Error Getting For Review Transactions: ' + errorDetail,
    };
  }
}

// Take the 'For Review' transaction data and return the relevant data in a formatted and typed object.
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
