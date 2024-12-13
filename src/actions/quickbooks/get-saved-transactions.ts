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

// Takes: Optional values for the start and end dates.
// Returns: An array of objects starting with a Query Result, then containing Transactions.
export async function getSavedTransactions(
  startDate = '',
  endDate = ''
): Promise<(QueryResult | Transaction)[]> {
  try {
    // Define the variable used to make the QBO calls.
    const qbo = await getQBObject();

    // Define a success tracking value used in error handling.
    let success = true;

    // Also define the format of the QuickBooks error response object.
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

    // Define a type for the Preference response to allow for type checking.
    type PreferenceResponse = {
      CurrencyPrefs: {
        MultiCurrencyEnabled: boolean;
      };
    };

    // Query User preferences to get the Multi-Currency preference for the User.
    // Multi-Currency determines the columnn that defines the Transaction amount.
    const preferences: PreferenceResponse = await new Promise((resolve) => {
      qbo.getPreferences((err: ErrorResponse, data: PreferenceResponse) => {
        if (err && checkFaultProperty(err)) {
          // Resolve the function to indicate Multi-Currency is not enabled.
          resolve({ CurrencyPrefs: { MultiCurrencyEnabled: false } });
        }
        resolve(data);
      });
    });

    // Defines the date range and the maximum number of returned Transactions.
    // Columns defines the columns included in the returned Transactions data.
    const parameters = {
      start_date: startDate,
      end_date: endDate,
      limit: 1000,
      columns: ['txn_type', 'name', 'other_account', 'memo'],
    };

    // Check MultiCurrencyEnabled and add the related column for the Transaction amount.
    if (preferences.CurrencyPrefs.MultiCurrencyEnabled) {
      parameters.columns.push('subt_nat_home_amount');
    } else {
      parameters.columns.push('subt_nat_amount');
    }

    // Define a type for the Transaction response to allow for type checking.
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

    // Use the defined parameters to fetch the Transactions from QuickBooks.
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

    // Create the results array and create a formatted Query Result for the call.
    // Push the Query Result to the first index of the results array.
    const results: (QueryResult | Transaction)[] = [];
    const QueryResult = createQueryResult(success, error);
    results.push(QueryResult);

    //  Get the Transaction Row data from the response.
    const responseRows = response.Rows.Row;

    // Check if Transaction rows were found and that the Query Result was not an error.
    if (responseRows && QueryResult.result !== 'Error') {
      // Call helper method to format response data into Transactions.
      await checkAndFormatTransactions(responseRows, results);
    }

    // Return the formatted results, only contains the Query Result on error.
    return results;
  } catch (error) {
    // Catch any errors and return an error Query Result, include the error message if it is present.
    if (error instanceof Error) {
      return [
        {
          result: 'Error',
          message:
            'Unexpected error occured while fetching saved Transactions.',
          detail: error.message,
        },
      ];
    } else {
      return [
        {
          result: 'Error',
          message:
            'Unexpected error occured while fetching saved Transactions.',
          detail: 'N/A',
        },
      ];
    }
  }
}

// Takes: The QuickBooks response Rows and a results array.
// Returns: A results array containing a Query Result in the first index and the formatted Transactions.
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
  // Call list of 'Expense' Accounts to check the Transaction Classifications against.
  const accounts = await getAccounts('Expense');
  const accountResults = accounts;

  // Check the Account fetch Query Result to see if it resulted in an error.
  if ((accountResults[0] as QueryResult).result === 'Error') {
    // Set and return the results, consists of an error Query Result with detail from the Account fetch.
    results = [
      {
        result: 'Error',
        message:
          'Unexpected Error Occured While Fetching Expense Accounts For Transaction Checking.',
        detail: (accountResults[0] as QueryResult).message,
      },
    ];
  } else {
    // If the fetch Accounts call was successful, define an array of only Accounts (no Query Result).
    const parsedAccounts: Account[] = accountResults.slice(1) as Account[];

    // Iterate through the Transaction Rows to find and format the Transaction data
    for (const row of rows) {
      // Check if the Row is a summary Row and skip it.
      if (row.Summary) {
        break;
      }

      // Define the index values of the Columns inside the Row with key values.
      const idRow = 0;
      const nameRow = 2;
      const categoryRow = 3;
      const amountRow = 4;

      // Skip Transactions missing a name or Category.
      if (
        row.ColData[nameRow].value !== '' &&
        row.ColData[categoryRow].value !== ''
      ) {
        // Chech there is an 'Expense' Account with the same name as the Transaction Category.
        if (
          parsedAccounts.some(
            (account) => account.name === row.ColData[categoryRow].value
          )
        ) {
          // Use the values from Transaction rows to create the Transaction.
          const newFormattedTransaction: Transaction = {
            name: String(row.ColData[nameRow].value),
            amount: Number(row.ColData[amountRow].value),
            category: String(row.ColData[categoryRow].value),
            taxCodeName: '',
          };

          // Search for the Purchase related to the Transaction and get the Tax Codes.
          const transactionPurchase = await findFormattedPurchase(
            String(row.ColData[idRow].id)
          );
          const userTaxCodes = await getTaxCodes();

          // Check if either the Account or Tax Code the fetches resulted in an error.
          if (
            transactionPurchase.resultInfo.result === 'Error' ||
            (userTaxCodes[0] as QueryResult).result === 'Error'
          ) {
            // Check and log which fetches resulted in error.
            const purchaseError =
              transactionPurchase.resultInfo.result === 'Error';
            const taxCodeError =
              (userTaxCodes[0] as QueryResult).result === 'Error';

            console.error(
              'Error getting Transaction tax details,\nPurchase Failure: ' +
                purchaseError +
                ', Tax Code Failure: ' +
                taxCodeError
            );

            // Log seperate errors with the error detail for each fetch that failed.
            if (purchaseError) {
              console.error(
                'Error Fetching Purchase: ' +
                  transactionPurchase.resultInfo.detail
              );
            }
            if (taxCodeError) {
              console.error(
                'Error fetching Tax Code: ' +
                  (userTaxCodes[0] as QueryResult).detail
              );
            }
          } else {
            // If both fetches were successful, iterate through the user Tax Codes.
            for (const taxCode of userTaxCodes.slice(1) as TaxCode[]) {
              // Find the Tax Code that matches the Puchase for the Transaction.
              if (taxCode.Id == transactionPurchase.taxCodeId) {
                // Update the formatted Transaction with the Tax Code name.
                newFormattedTransaction.taxCodeName = taxCode.Name;
              }
            }
            // Add the new formatted Transaction to the results array.
            results.push(newFormattedTransaction);
          }
        }
      }
    }
  }
}
