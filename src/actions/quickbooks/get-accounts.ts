'use server';

import { checkFaultProperty, createQueryResult } from './index';

import { getQBObject } from '@/actions/qb-client';

import type { Account, ErrorResponse } from '@/types/index';

// Get specific Accounts from the QuickBooks API depending on passed Account type.
// Use 'Transaction' to fetch Accounts that contain 'For Review' Transactions.
// Use 'Expense' to get Accounts for Categorization.
// Takes: The account type as either a 'Transaction' or 'Expense' string.
// Returns: An array of objects starting with a Query Result, then containing Purchase objects.
export async function getAccounts(accountType: string): Promise<string> {
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

    // Define a type for the QBO response to allow for type checking.
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

    // Define a parameters variable, then check the passed Transaction type to set the it accordingly.
    let parameters;
    if (accountType === 'Expense') {
      // Define the query parameters for 'Expense' Account fetching.
      // Fetches Accounts with Classification set to 'Expense' (Represent a possible Transaction Category).
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
      // If no valid type was passed, return an error Query Result.
      return JSON.stringify([
        {
          result: 'error',
          message: 'Invalid Transaction Fetch Type Passed',
          detail: `Passed Transaction Type To Fetch Was Not 'Expense' or 'Transaction'`,
        },
      ]);
    }

    // Used the defined parameters to fetch specified User Accounts from QuickBooks.
    const response: AccountResponse = await new Promise((resolve) => {
      qbo.findAccounts(
        parameters,
        (err: ErrorResponse, data: AccountResponse) => {
          // If there is an error, check if it has a 'Fault' property.
          if (err && checkFaultProperty(err)) {
            // Define success as false and record the error.
            success = false;
            error = err;
          }
          resolve(data);
        }
      );
    });

    //  Get the Account data from the response and create a results array.
    const accounts = response.QueryResponse.Account;
    const results = [];

    // Create a formatted Query Result object for the QBO API call.
    // Push the Query Result to the first index of the results array.
    const queryResult = createQueryResult(success, error);
    results.push(queryResult);

    // Iterate through the returned Accounts and ignore any that are marked as inactive.
    for (const account of accounts) {
      if (account.Active) {
        // Create an Account object for the current Account response and push it to the results array.
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
    // Return the array of Account objects with a Query Result in the first index as a JSON string.
    return JSON.stringify(results);
  } catch (error) {
    // Catch any errors and return an error Query Result, include the error message if it is present.
    if (error instanceof Error) {
      return JSON.stringify([
        {
          result: 'Error',
          message: 'Unexpected error occured while fetching Accounts.',
          detail: error.message,
        },
      ]);
    } else {
      return JSON.stringify([
        {
          result: 'Error',
          message: 'Unexpected error occured while fetching Accounts.',
          detail: 'N/A',
        },
      ]);
    }
  }
}
