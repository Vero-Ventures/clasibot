'use server';
import { getAccounts } from './get-accounts';
import { findFormattedPurchase } from './find-purchase';
import { checkFaultProperty, createQueryResult } from './query-helpers';
import { getTaxCodes } from './taxes';
import { createQBObject, createQBObjectWithSession } from '@/actions/qb-client';
import type { Account } from '@/types/Account';
import type { ErrorResponse } from '@/types/ErrorResponse';
import type { TaxCode } from '@/types/TaxCode';
import type { Transaction } from '@/types/Transaction';
import type { Session } from 'next-auth/core/types';
import type { QueryResult } from '@/types/QueryResult';

// Get all past saved transactions from the QuickBooks API.
// May take a start date and end date and / or a synthetic session as optional parameters.
// Returns: An array of objects starting with a Query Result, then containing Transaction objects.
export async function getSavedTransactions(
  startDate = '',
  endDate = '',
  session: Session | null = null
): Promise<string> {
  try {
    // Define the variable used to make the qbo calls.
    let qbo;

    // Check if a session was passed by a backend function to be used to define the qbo object.
    // Then create the qbo object for frontend or backend functions based on the session presence.
    if (session) {
      qbo = await createQBObjectWithSession(session);
    } else {
      qbo = await createQBObject();
    }

    // Define success tracker and error response object for error handling of QuickBooks queries.
    let success = true;
    let error: ErrorResponse = {
      Fault: {
        Error: [
          {
            Message: '',
            Detail: '',
            code: '',
            element: '',
          },
        ],
        type: '',
      },
    };

    // Define a type for the response object to allow for type checking.
    type PreferenceResponse = {
      CurrencyPrefs: {
        MultiCurrencyEnabled: boolean;
      };
    };

    // Query user preferences to get the multi-currency preference for the user.
    // Multi-Currency determines the name of the columnn that contains the transaction amount.
    const preferences: PreferenceResponse = await new Promise((resolve) => {
      qbo.getPreferences((err: ErrorResponse, data: PreferenceResponse) => {
        if (err && checkFaultProperty(err)) {
          // Resolve the function with a response formatted to indicate Multi Currency is not enabled.
          resolve({ CurrencyPrefs: { MultiCurrencyEnabled: false } });
        }
        resolve(data);
      });
    });

    // Get the current date to potentially use in start and end date setting..
    const today = new Date();

    // If no start date was passed as an argument, define a default start date.
    // Default Balue: 2 years ago.
    if (startDate === '') {
      const TwoYearsAgo = new Date(
        today.getFullYear() - 2,
        today.getMonth(),
        today.getDate()
      );
      startDate = TwoYearsAgo.toISOString().split('T')[0];
    }

    // If no end date was passed as an argument, set the end date to the default: the current date.
    if (endDate === '') {
      endDate = today.toISOString().split('T')[0];
    }

    // Defines the start date, end date, maximum returned transactions.
    // Columns defines a list of the data columns for each transaction to included as part of the response.
    const parameters = {
      start_date: startDate,
      end_date: endDate,
      limit: 1000,
      columns: ['txn_type', 'name', 'other_account'],
    };

    // Check MultiCurrencyEnabled and add the appropriate column that determines transaction amount to the parameters.
    if (preferences.CurrencyPrefs.MultiCurrencyEnabled) {
      parameters.columns.push('subt_nat_home_amount');
    } else {
      parameters.columns.push('subt_nat_amount');
    }

    // Define a type for the response object to allow for type checking.
    type TransactionResponse = {
      Rows: {
        Row: {
          ColData: { value: string | number; id: string }[];
          Summary: string;
        }[];
      };
      Error: {
        Message: string;
        Detail: string;
      }[];
    };

    // Call API to get a list of transactions.
    const response: TransactionResponse = await new Promise((resolve) => {
      qbo.reportTransactionList(
        parameters,
        (err: ErrorResponse, data: TransactionResponse) => {
          // If there is an error, check if it has a 'Fault' property
          if (err && checkFaultProperty(err)) {
            // Define success as false and record the error.
            success = false;
            error = err;
          }
          resolve(data);
        }
      );
    });

    // Get the results rows from the JSON response and define a results array.
    const responseRows = response.Rows.Row;
    const results: (QueryResult | Transaction)[] = [];

    // Create a formatted Query Result object for the QBO API call then push it to the first index of the transactions array.
    const QueryResult = createQueryResult(success, error);
    results.push(QueryResult);

    // Check if transaction rows were reterned by the QuickBooks API call and the query result was not an error.
    if (responseRows && QueryResult.result !== 'Error') {
      // Call helper method to check and format response data and return an array of valid formatted transactions.
      checkAndFormatTransactions(responseRows, results, session);
    }

    // Return the formatted results as a JSON string.
    return JSON.stringify(results);
  } catch (error) {
    // Catch any errors and return them an stringified error Query Result inside an array to match standard formatting.
    // Set the detail string to the error message if it is present.
    if (error instanceof Error) {
      return JSON.stringify([
        {
          result: 'error',
          message:
            'Unexpected error occured while fetching saved transactions.',
          detail: error.message,
        },
      ]);
    } else {
      return JSON.stringify([
        {
          result: 'error',
          message:
            'Unexpected error occured while fetching saved transactions.',
          detail: 'N/A',
        },
      ]);
    }
  }
}

// Takes the QuickBooks response rows and a results array.
// Also takes the session to make purchase calls for both frontend and backend calls.
// Formats the rows response into transactions to be stored in the results array.
// Returns: A results array containing a Query Result in the first index and the formatted Transaction objects.
async function checkAndFormatTransactions(
  rows: {
    ColData: {
      value: string | number;
      id: string;
    }[];
    Summary: string;
  }[],
  results: (QueryResult | Transaction)[],
  session: Session | null
) {
  // Call list of expense accounts to check the transaction classifications against.
  const accounts = await getAccounts('Expense');
  const accountResults = JSON.parse(accounts);

  // Check if the account call was a failure and set the Query Result index of the results to an error if it was.
  if (accountResults[0].result === 'Error') {
    results[0] = {
      result: 'error',
      message:
        'Unexpected error occured while fetching expense accounts for transaction checking.',
      detail: accountResults[0].message,
    };
  } else {
    // If the accounts call was successful, remove the Query Result from the first index and define the array of Account objects.
    const parsedAccounts: Account[] = accountResults.slice(1);

    // Iterate through the transaction rows to check and format them.
    for (const row of rows) {
      // Check if the row is a summary row and skip it if it is.
      if (row.Summary) {
        break;
      }

      // Define the index values of the important transaction values.
      const idRow = 0;
      const nameRow = 1;
      const categoryRow = 2;
      const amountRow = 3;

      // Skip no-name transactions (needed for prediction matching), transactions without a category,
      // Transactions without an amount are skiped as it ensures only expense transactions are recorded (also helps with prediction ordering).
      if (
        row.ColData[nameRow].value !== '' &&
        row.ColData[categoryRow].value !== '' &&
        Number(row.ColData[amountRow].value) < 0
      ) {
        // Only continue if an expense account with the same name as the category exists.
        if (
          parsedAccounts.some(
            (account) => account.name === row.ColData[categoryRow].value
          )
        ) {
          // Convert the values from transaction row to a Transaction object.
          // Explicitly defined types due to values from the API being both strings and numbers.
          const newFormattedTransaction: Transaction = {
            name: String(row.ColData[nameRow].value),
            amount: Number(row.ColData[amountRow].value),
            category: String(row.ColData[categoryRow].value),
            taxCodeName: '',
          };

          // Search for the purchase related to the transaction to get the tax rate.
          // Pass the session to work with both frontend and backend calls.
          const transactionPurchase = await findFormattedPurchase(
            String(row.ColData[idRow].id),
            session
          );

          // Get the users tax codes and parse it to a Query Result and an array of Tax Code objects.
          const userTaxCodes = JSON.parse(await getTaxCodes(session));

          // Check if fetch of either the purchase and tax codes resulted in an error.
          if (
            transactionPurchase.result_info.result === 'Error' ||
            userTaxCodes[0].result === 'Error'
          ) {
            // Define truth values for both the purchase and tax codes to indicate if that fetch failed.
            const purchaseError =
              transactionPurchase.result_info.result === 'Error';
            const taxCodeError = userTaxCodes[0].result === 'Error';

            // When an error occurs, leave the tax code unfilled and log an error.
            console.log(
              'Error getting transaction tax details, Purchase Failure? ' +
                purchaseError +
                ', Tax Code Failure? ' +
                taxCodeError
            );

            if (purchaseError) {
              console.error(
                'Error Fetching Purchase: ' +
                  transactionPurchase.result_info.detail
              );
            }

            if (taxCodeError) {
              console.error(
                'Error fetching Tax Code: ' + userTaxCodes[0].detail
              );
            }
          } else {
            // If both retrivals were successful, skip the Query Result and iterate through the user tax codes.
            for (const taxCode of userTaxCodes.slice(1) as TaxCode[]) {
              // Find the tax code that matches the one in the purchase object related to the current transaction row.
              if (taxCode.Id == transactionPurchase.taxCodeId) {
                // Update the formatted transaction with the tax code name.
                newFormattedTransaction.taxCodeName = taxCode.Name;
              }
            }

            // Add the formatted transaction for the current row to the array.
            results.push(newFormattedTransaction);
          }
        }
      }
    }
  }
}
