'use server';

import { getAccounts, findFormattedPurchase, getTaxCodes } from './index';

import { checkFaultProperty, createQueryResult } from '@/actions/helpers/index';

import { getQBObject } from '@/actions/quickbooks/qb-client';

import type {
  Account,
  ErrorResponse,
  QueryResult,
  TaxCode,
  Transaction,
} from '@/types/index';

// Get all past saved Transaction from the QuickBooks API.
// Takes: Optional values for a start date and end date.
// Returns: An array of objects starting with a Query Result, then containing Transaction objects.
export async function getSavedTransactions(
  startDate = '',
  endDate = ''
): Promise<(QueryResult | Transaction)[]> {
  try {
    // Define the variable used to make the qbo calls.
    const qbo = await getQBObject();

    // Define a success tracking value and the format of QuickBooks and error response objects.
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

    // Query User preferences to get the Multi-Currency preference for the User.
    // Multi-Currency determines the name of the columnn that contains the Transaction amount.
    const preferences: PreferenceResponse = await new Promise((resolve) => {
      qbo.getPreferences((err: ErrorResponse, data: PreferenceResponse) => {
        if (err && checkFaultProperty(err)) {
          // Resolve the function with a response formatted to indicate Multi-Currency is not enabled.
          resolve({ CurrencyPrefs: { MultiCurrencyEnabled: false } });
        }
        resolve(data);
      });
    });

    // Defines the date range and the maximum number of returned Transactions.
    // Columns defines a list of the data columns to include for the Transactions.
    const parameters = {
      start_date: startDate,
      end_date: endDate,
      limit: 1000,
      columns: ['txn_type', 'name', 'other_account'],
    };

    // Check MultiCurrencyEnabled and add the appropriate parameters for Transaction amount column.
    if (preferences.CurrencyPrefs.MultiCurrencyEnabled) {
      parameters.columns.push('subt_nat_home_amount');
    } else {
      parameters.columns.push('subt_nat_amount');
    }

    // Define a type for the QBO response to allow for type checking.
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

    // Used the defined parameters to fetch User Transactions from QuickBooks.
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

    //  Get the Transaction Row data from the response and create a results array.
    const responseRows = response.Rows.Row;
    const results: (QueryResult | Transaction)[] = [];

    // Create a formatted Query Result object for the QBO API call.
    // Push the Query Result to the first index of the results array.
    const QueryResult = createQueryResult(success, error);
    results.push(QueryResult);

    // Check if Transaction rows were found and that the Query Result was not an error.
    if (responseRows && QueryResult.result !== 'Error') {
      // Call helper method to check and format response data into Transactions.
      checkAndFormatTransactions(responseRows, results);
    }

    // Return the formatted results as a JSON string.
    return results;
  } catch (error) {
    // Catch any errors and return an error Query Result, include the error message if it is present.
    if (error instanceof Error) {
      return [
        {
          result: 'error',
          message:
            'Unexpected error occured while fetching saved Transactions.',
          detail: error.message,
        },
      ];
    } else {
      return [
        {
          result: 'error',
          message:
            'Unexpected error occured while fetching saved Transactions.',
          detail: 'N/A',
        },
      ];
    }
  }
}

// Formats the response rows into Transactions.
// Takes: The QuickBooks response rows and a results array.
// Returns: A results array containing a Query Result in the first index and the formatted Transaction objects.
async function checkAndFormatTransactions(
  rows: {
    ColData: {
      value: string | number;
      id: string;
    }[];
    Summary: string;
  }[],
  results: (QueryResult | Transaction)[]
) {
  // Call list of expense Accounts to check the Transaction Classifications against.
  const accounts = await getAccounts('Expense');
  const accountResults = accounts;

  // Check the Account fetch Query Result to see if it resulted in an error.
  if ((accountResults[0] as QueryResult).result === 'Error') {
    // Set the to contain an error Query Result with the message from the Account fetch Query Result as the detail.
    results = [
      {
        result: 'error',
        message:
          'Unexpected error occured while fetching expense Accounts for Transaction checking.',
        detail: (accountResults[0] as QueryResult).message,
      },
    ];
  } else {
    // If the fetch Accounts call was successful, define an array of just the Account objects (no Query Result).
    const parsedAccounts: Account[] = accountResults.slice(1) as Account[];

    // Iterate through the Transaction rows to find and format the Transaction data
    for (const row of rows) {
      // Check if the row is a summary row and skip it.
      if (row.Summary) {
        break;
      }

      // Define the index values of the rows with important Transaction values.
      const idRow = 0;
      const nameRow = 1;
      const categoryRow = 2;
      const amountRow = 3;

      // Skip Transactions missing a name, Category, or without a negative amount.
      if (
        row.ColData[nameRow].value !== '' &&
        row.ColData[categoryRow].value !== '' &&
        Number(row.ColData[amountRow].value) < 0
      ) {
        // Only continue if there is an expense Account with the same name as the Transaction Category.
        if (
          parsedAccounts.some(
            (account) => account.name === row.ColData[categoryRow].value
          )
        ) {
          // Use the values from Transaction rows to create the Transaction object.
          //    Explicitly defined types due to values being passed as either strings or numbers.
          const newFormattedTransaction: Transaction = {
            name: String(row.ColData[nameRow].value),
            amount: Number(row.ColData[amountRow].value),
            category: String(row.ColData[categoryRow].value),
            taxCodeName: '',
          };

          // Search for the Purchase related to the Transaction to get the Tax Code.
          const transactionPurchase = await findFormattedPurchase(
            String(row.ColData[idRow].id)
          );

          // Get the User Tax Codes and parse it to a Query Result and an array of Tax Code objects.
          const userTaxCodes = JSON.parse(await getTaxCodes());

          // Check if either of the fetches resulted in an error Query Result.
          if (
            transactionPurchase.result_info.result === 'Error' ||
            userTaxCodes[0].result === 'Error'
          ) {
            // Define values for both Classifications to indicate if that fetch resulted in an error.
            const purchaseError =
              transactionPurchase.result_info.result === 'Error';
            const taxCodeError = userTaxCodes[0].result === 'Error';

            // Log an error indicating an issue with the Transaction.
            console.error(
              'Error getting Transaction tax details,\nPurchase Failure: ' +
                purchaseError +
                ', Tax Code Failure: ' +
                taxCodeError
            );

            // Log seperate errors with the error details for each fetch that failed.
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
            // If both fetches were successful, iterate through the user Tax Codes.
            // Skips the Query Result in the first index.
            for (const taxCode of userTaxCodes.slice(1) as TaxCode[]) {
              // Find the Tax Code that matches the one in the Puchase object for the Transaction.
              if (taxCode.Id == transactionPurchase.taxCodeId) {
                // Update the formatted Transaction with the Tax Code name.
                newFormattedTransaction.taxCodeName = taxCode.Name;
              }
            }

            // Add the new formatted Transaction to the array.
            results.push(newFormattedTransaction);
          }
        }
      }
    }
  }
}
