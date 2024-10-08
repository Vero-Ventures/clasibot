'use server';

import { createQBObject } from '../qb-client';
import { checkFaultProperty, createQueryResult } from './helpers';
import type { ErrorResponse } from '@/types/ErrorResponse';
import type { Transaction } from '@/types/Transaction';

// Get all transactions from the QuickBooks API.
// Can take a start date and end date as optional parameters.
export async function getTransactions(
  startDate = '',
  endDate = ''
): Promise<string> {
  try {
    // Create the QuickBooks API object.
    const qbo = await createQBObject();

    // Define success and error trackers for query response creation.
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
    const preferences: PreferenceResponse = await new Promise((resolve) => {
      qbo.getPreferences((err: ErrorResponse, data: PreferenceResponse) => {
        if (err && checkFaultProperty(err)) {
          // If there was an error getting the preferences:
          // Resolve with a PreferenceResponse with the multi-currency preference to false.
          resolve({ CurrencyPrefs: { MultiCurrencyEnabled: false } });
        }
        resolve(data);
      });
    });

    // Get the current date.
    const today = new Date();

    // If there is no start date passed as an argument, define the default start date.
    // Current default value: 2 years ago.
    if (startDate === '') {
      const TwoYearsAgo = new Date(
        today.getFullYear() - 2,
        today.getMonth(),
        today.getDate()
      );
      startDate = TwoYearsAgo.toISOString().split('T')[0];
    }

    // If there is no end date passed as an argument, set the end date to the current date.
    if (endDate === '') {
      endDate = today.toISOString().split('T')[0];
    }

    // Defines the start date, end date, maximum returned transactions.
    // Also defines a list of the relevant data columns to include.
    const parameters = {
      start_date: startDate,
      end_date: endDate,
      limit: 1000,
      columns: ['txn_type', 'name', 'account_name', 'other_account'],
    };

    // Check if the user has multi-currency enabled and add the appropriate amount column to the parameters.
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
            success = false;
            error = err;
          }
          resolve(data);
        }
      );
    });

    // Get the results rows from the JSON response.
    const results = response.Rows.Row;

    const formattedTransactions = [];

    // Create a formatted query result object based on the query results and append it to the array.
    const QueryResult = createQueryResult(success, error);
    formattedTransactions.push(QueryResult);

    // Define valid expense transaction types.
    const purchaseTransactions = [
      'Check',
      'Cash Expense',
      'Credit Card Expense',
      'Expense',
    ];

    // If no rows were returned, skip formatting the transactions and return the result field.
    if (results !== undefined) {
      for (const transaction of results) {
        // Check if the transaction is a summary row and skip it.
        if (transaction.Summary) {
          break;
        }
        // Define the rows of the important returned values.
        const nameRow = 1;
        const accountRow = 2;
        const categoryRow = 3;
        const amountRow = 4;

        // Skip no-name transactions, transactions without an account, and transactions without an amount.
        if (
          purchaseTransactions.includes(String(transaction.ColData[0].value)) &&
          transaction.ColData[nameRow].value !== '' &&
          transaction.ColData[accountRow].value !== '' &&
          transaction.ColData[categoryRow].value !== '' &&
          transaction.ColData[nameRow].value !== ''
        ) {
          // Reads the values from the specified columns in the current row of the results.
          // Explicitly define the types due to values from the API being either a string or number.
          const newFormattedTransaction: Transaction = {
            name: String(transaction.ColData[nameRow].value),
            amount: Number(transaction.ColData[amountRow].value),
            category: String(transaction.ColData[categoryRow].value),
          };
          formattedTransactions.push(newFormattedTransaction);
        }
      }
    }
    // Return the formatted results as a JSON string.
    return JSON.stringify(formattedTransactions);
  } catch (error) {
    return JSON.stringify(error);
  }
}
