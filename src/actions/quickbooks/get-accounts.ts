'use server';

import { checkFaultProperty, createQueryResult } from '@/actions/helpers/index';

import { getQBObject } from '@/actions/quickbooks/qb-client';

import type { Account, ErrorResponse, QueryResult } from '@/types/index';

// Takes: The Account type as either a 'Transaction' or 'Expense' string.
// 'Transaction': fetch Accounts that contain 'For Review' Transactions.
// 'Expense': fetch Accounts that define Categorization options.
// Returns: An array of objects starting with a Query Result, then containing Accounts.
export async function getAccounts(
  accountType: string
): Promise<(QueryResult | Account)[]> {
  try {
    // Define the variable used to make the QBO calls.
    const qbo = await getQBObject();

    // Define a success tracking value used in error handling.
    let success = true;

    // Also define the format of the QuickBooks data and error response objects.
    type AccountResponse = {
      QueryResponse: {
        Account: {
          Id: string;
          Name: string;
          Active: boolean;
          Classification: string;
          AccountType: string;
          AccountSubType: string;
        }[];
      };
      Error: {
        Message: string;
        Detail: string;
      }[];
    };
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

    // Define a parameters variable and check the Account type to set its values.
    let parameters;
    if (accountType === 'Expense') {
      // Define the query parameters for 'Expense' Account fetching.
      // Fetches Accounts with Classification set to 'Expense' (Define a possible Category).
      parameters = [
        {
          field: 'Classification',
          value: ['Expense'],
          operator: 'IN',
          limit: 1000,
        },
      ];
    } else if (accountType === 'Transaction') {
      // Define the query parameters for 'Transaction' Account fetching.
      // Fetches Accounts that may contain 'For Review' transactions.
      parameters = [
        {
          field: 'AccountSubType',
          value: [
            'CreditCard',
            'Checking',
            'MoneyMarket',
            'RentsHeldInTrust',
            'Savings',
            'TrustAccounts',
            'CashOnHand',
          ],
          operator: 'IN',
          limit: 1000,
        },
      ];
    } else {
      // If no valid type was passed, return an array with only the error Query Result.
      return [
        {
          result: 'Error',
          message: 'Invalid Transaction Fetch Type Passed',
          detail: `Passed Transaction Type To Fetch Was Not 'Expense' or 'Transaction'`,
        },
      ];
    }

    // Use the defined parameters to fetch specified Accounts from QuickBooks.
    const response: AccountResponse = await new Promise((resolve) => {
      qbo.findAccounts(
        parameters,
        (err: ErrorResponse, data: AccountResponse) => {
          // If there is an error, check if it has a 'Fault' property.
          if (err && checkFaultProperty(err)) {
            // Set the success value to false and record the error.
            success = false;
            error = err;
          }
          resolve(data);
        }
      );
    });

    // Create the results array and create a formatted Query Result for the call.
    // Push the Query Result to the first index of the results array.
    const results = [];
    const queryResult = createQueryResult(success, error);
    results.push(queryResult);

    //  Get the Account data from the call response.
    const accounts = response.QueryResponse.Account;

    // Iterate through the returned Accounts and ignore any that are marked as inactive.
    for (const account of accounts) {
      if (account.Active) {
        // Create an Account for the current Account response and push it to the results array.
        const newFormattedAccount: Account = {
          id: account.Id,
          name: account.Name,
          active: account.Active,
          classification: account.Classification,
          account_sub_type: account.AccountSubType,
        };
        results.push(newFormattedAccount);
      }
    }
    // Return the array of Accounts with the Query Result in the first index.
    return results;
  } catch (error) {
    // Catch any errors and return an error Query Result, include the error message if it is present.
    if (error instanceof Error) {
      return [
        {
          result: 'Error',
          message: 'Unexpected error occured while fetching Accounts.',
          detail: error.message,
        },
      ];
    } else {
      return [
        {
          result: 'Error',
          message: 'Unexpected error occured while fetching Accounts.',
          detail: 'N/A',
        },
      ];
    }
  }
}
