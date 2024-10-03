'use server';
import { createQBObject } from '../qb-client';
import { checkFaultProperty, createQueryResult } from './helpers';
import type { Account } from '@/types/Account';
import type { ErrorResponse } from '@/types/ErrorResponse';

// Get all accounts from the QuickBooks API.
// Use 'Transaction' to fetch accounts that contain 'For Review' Transactions.
// Use 'Expense' to get accounts for transaction categorization.
export async function getAccounts(accountType: string): Promise<string> {
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

    // Define classificaion as expense by default.
    let classification = [
      {
        field: 'Classification',
        value: ['Expense'],
        operator: 'IN',
        limit: 1000,
      },
    ];
    if (accountType === 'Transaction') {
      classification = [
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

    // Get the expense accounts, searching by their classification (Expense or accounts related to transactions).
    // ***Variable*** Returns a limit of 1000 accounts.
    const response: AccountResponse = await new Promise((resolve) => {
      qbo.findAccounts(
        classification,
        (err: ErrorResponse, data: AccountResponse) => {
          // If there is an error, check if it has a 'Fault' property.
          if (err && checkFaultProperty(err)) {
            success = false;
            error = err;
          }
          resolve(data);
        }
      );
    });

    const results = response.QueryResponse.Account;
    const formattedAccounts = [];

    // Create a formatted query result object based on the query results and append it to the array.
    const queryResult = createQueryResult(success, error);
    formattedAccounts.push(queryResult);

    // Ignore any inactive accounts and add the rest to the formatted results.
    for (const account of results) {
      if (account.Active) {
        const newFormattedAccount: Account = {
          id: account.Id,
          name: account.Name,
          active: account.Active,
          classification: account.Classification,
          account_sub_type: account.AccountSubType,
        };
        formattedAccounts.push(newFormattedAccount);
      }
    }
    // Return the formatted results as a JSON string.
    return JSON.stringify(formattedAccounts);
  } catch (error) {
    return JSON.stringify(error);
  }
}
