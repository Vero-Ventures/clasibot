'use server';
import { checkFaultProperty, createQueryResult } from './query-helpers';
import { createQBObject, createQBObjectWithSession } from '@/actions/qb-client';
import type { Account } from '@/types/Account';
import type { ErrorResponse } from '@/types/ErrorResponse';
import type { Session } from 'next-auth/core/types';

// Get specific accounts from the QuickBooks API depending on passed account type.
// Use 'Transaction' to fetch accounts that contain 'For Review' Transactions.
// Use 'Expense' to get accounts for transaction categorization.
// May take a synthetic login session to use instead of the regular session.
// Returns: An array of objects starting with a Query Result, then containing Purchase objects.
export async function getAccounts(
  accountType: string,
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

    // Define the query parameters for 'Expense' account fetching.
    // Fetches accounts with Classification equal to 'Expense'.
    // Fetches all accounts that represent an transaction category.
    //(Use IN on an array for same query type across both account types.)
    let parameters = [
      {
        field: 'Classification',
        value: ['Expense'],
        operator: 'IN',
        limit: 1000,
      },
    ];

    // Update query parameters for fetching 'Transaction' accounts.
    // Defines a query to get all accounts that may contain 'For Review' transactions.
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

    // Used the defined parameters to fetch the accounts from QuickBooks.
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

    //  Get the needed account data from the QuickBooks API response.
    const accounts = response.QueryResponse.Account;
    const results = [];

    // Create a formatted Query Result object for the QBO API call then push it to the first index of the results array.
    const queryResult = createQueryResult(success, error);
    results.push(queryResult);

    // Iterate through the returned accounts and ignore any that are marked as inactive.
    for (const account of accounts) {
      if (account.Active) {
        // Format the response information to an Account object and push it to the results array.
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
    // Catch any errors and return them an stringified error Query Result inside an array to match standard formatting.
    // Set the detail string to the error message if it is present.
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
