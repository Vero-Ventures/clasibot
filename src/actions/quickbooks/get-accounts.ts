'use server';
import { createQBObject } from '../qb-client';
import { checkFaultProperty, createQueryResult } from './helpers';
import type { Account } from '@/types/Account';

// Get all accounts from the QuickBooks API.
export async function getAccounts(): Promise<string> {
  try {
    // Create the QuickBooks API object.
    const qbo = await createQBObject();
    let success = true;

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

    // Get the expense accounts, searching by their classification (Expense).
    // ***Variable*** Returns a limit of 1000 accounts.
    const response: AccountResponse = await new Promise((resolve) => {
      qbo.findAccounts(
        { Classification: 'Expense', limit: 1000 },
        (err: Error, data: AccountResponse) => {
          // If there is an error, check if it has a 'Fault' property.
          if (err && checkFaultProperty(err)) {
            success = false;
          }
          resolve(data);
        }
      );
    });

    const results = response.QueryResponse.Account;
    const formattedAccounts = [];

    // Create a formatted query result object based on the query results.
    const queryResult = createQueryResult(success, response);
    formattedAccounts.push(queryResult);

    // Ignore any inactive accounts and add the rest to the formatted results.
    for (const account of results) {
      if (account.Active) {
        const newFormattedAccount: Account = {
          id: account.Id,
          name: account.Name,
          active: account.Active,
          classification: account.Classification,
          account_type: account.AccountType,
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