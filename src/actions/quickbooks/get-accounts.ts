'use server';
import { checkFaultProperty, createQueryResult } from './query-helpers';
import { getQBObject, getQBObjectWithSession } from '@/actions/qb-client';
import type { Account } from '@/types/Account';
import type { ErrorResponse } from '@/types/ErrorResponse';
import type { LoginTokens } from '@/types/LoginTokens';

// Get specific Accounts from the QuickBooks API depending on passed Account type.
// Use 'Transaction' to fetch Accounts that contain 'For Review' Transactions.
// Use 'Expense' to get Accounts for Categorization.
// May take a synthetic login session to use instead of the regular session.
// Returns: An array of objects starting with a Query Result, then containing Purchase objects.
export async function getAccounts(
  accountType: string,
  loginTokens: LoginTokens | null = null,
  companyId: string | null = null
): Promise<string> {
  try {
    // Define the variable used to make the qbo calls.
    let qbo;

    // Check if synthetic Login Tokens and Company realm Id were passed to login through backend.
    if (loginTokens && companyId) {
      // If tokens were passed, preform backend login process.
      qbo = await getQBObjectWithSession(loginTokens, companyId);
    } else {
      // Otherwise, preform the regular frontend login.
      qbo = await getQBObject();
    }

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

    // Define the query parameters for 'Expense' Account fetching.
    // Fetches Accounts with Classification set to 'Expense' (Represent a possible Transaction Category).
    let parameters = [
      {
        field: 'Classification',
        value: ['Expense'],
        operator: 'IN',
        limit: 1000,
      },
    ];

    // Update query parameters if fetching 'Transaction' Accounts.
    // Defines a query to get all Accounts that may contain 'For Review' transactions.
    if (accountType === 'Transaction') {
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
          result: 'error',
          message: 'Unexpected error occured while fetching accounts.',
          detail: error.message,
        },
      ]);
    } else {
      return JSON.stringify([
        {
          result: 'error',
          message: 'Unexpected error occured while fetching accounts.',
          detail: 'N/A',
        },
      ]);
    }
  }
}
