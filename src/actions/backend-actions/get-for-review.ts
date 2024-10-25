'use server';
import type {
  ForReviewTransaction,
  FormattedForReviewTransaction,
} from '@/types/ForReviewTransaction';
import type { LoginTokens } from '@/types/LoginTokens';
import type { QueryResult } from '@/types/QueryResult';

// Checks a specific Account of the User for 'For Review' transactions, formats and returns them.
// Takes: The Id of Account to check, a set of synthetic Login Tokens, and the Company realm Id.
// Returns: A Query Result object with the found 'For Review' transactions in the detail field (only on success).
//    Returned 'For Review' transactions are an array of Sub-arrays in the format [FormattedForReviewTransaction, ForReviewTransaction].
export async function getForReview(
  accountId: string,
  loginTokens: LoginTokens,
  companyId: string
): Promise<QueryResult> {
  try {
    // Define the parameters for the GET call, then define the full endpoint.
    // Uses the Id of the Company and the Id of the Account to fetch the 'For Review' transactions from.
    const parameters = `accountId=${accountId}&sort=-txnDate&reviewState=PENDING&ignoreMatching=false`;
    const endpoint = `https://c15.qbo.intuit.com/qbo15/neo/v1/company/${companyId}/olb/ng/getTransactions?${parameters}`;

    // Call the query endpoint while passing the required header cookies.
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        cookie: `qbo.tkt=${loginTokens?.qboTicket}; qbo.agentid=${process.env.BACKEND_AGENT_ID}; qbo.parentid=${companyId}; qbo.authid=${loginTokens.authId}; SameSite=None`,
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
      items: [ForReviewTransaction];
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
  responseData: ForReviewTransaction[]
): (FormattedForReviewTransaction | ForReviewTransaction)[][] {
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
