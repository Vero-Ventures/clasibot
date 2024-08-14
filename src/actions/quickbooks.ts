/**
 * Defines the actions to interact with the QuickBooks API.
 * Uses helper methods to check the fault property of returned values and create formatted result headers.
 */
'use server';
import { createQBObject } from '@/actions/qb-client';
import type { Account } from '@/types/Account';
import type { Purchase } from '@/types/Purchase';
import type { PurchaseResponse } from '@/types/PurchaseResponse';
import type { QueryResult } from '@/types/QueryResult';
import type { Transaction } from '@/types/Transaction';

// Check for fault property in returned error objects.
function checkFaultProperty(error: unknown): error is { Fault: unknown } {
  // Error is passed as any, so check if it is an object.
  if (typeof error === 'object' && error !== null) {
    // If an object was passed, check if it has a 'Fault' property.
    // Return a truth value based on the presence of the property.
    return 'Fault' in error;
  }
  // If the error is not an object, return false.
  return false;
}

// Get all accounts from the QuickBooks API.
export async function getAccounts(): Promise<string> {
  try {
    // Create the QuickBooks API object.
    const qbo = await createQBObject();

    // Create tracker to indicate if the query was successful or not.
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
          // If there is an error, check if it has a 'Fault' property
          if (err && checkFaultProperty(err)) {
            // If there was an error getting the accounts, set the success tracker to false.
            success = false;
          }
          // If there is no error, resolve the data to allow the caller to access the results.
          resolve(data);
        }
      );
    });

    // Get response as result array.
    const results = response.QueryResponse.Account;

    // Create an empty array to hold the accounts.
    const formattedAccounts = [];

    // Create a formatted result object based on the query results.
    const queryResult = createQueryResult(success, response);

    // Add the formatted result object to the start of accounts array.
    formattedAccounts.push(queryResult);

    // For each account object, remove unnecessary fields and ignore any inactive accounts.
    for (const account of results) {
      // Only add active accounts
      if (account.Active) {
        // Create a formatted account object with the necessary fields.
        // Values are defined in the Account type.
        const newFormattedAccount: Account = {
          id: account.Id,
          name: account.Name,
          active: account.Active,
          classification: account.Classification,
          account_type: account.AccountType,
          account_sub_type: account.AccountSubType,
        };
        // Add the formatted account to the accounts array.
        formattedAccounts.push(newFormattedAccount);
      }
    }
    // Return the formatted results as a JSON string.
    return JSON.stringify(formattedAccounts);
  } catch (error) {
    // Return any caught errors.
    return JSON.stringify(error);
  }
}

// Get all transactions from the QuickBooks API.
// Can take a start date and end date as optional parameters.
export async function getTransactions(
  startDate = '',
  endDate = ''
): Promise<string> {
  try {
    // Create the QuickBooks API object.
    const qbo = await createQBObject();

    // Create tracker to indicate if the query was successful or not.
    let success = true;

    // Define a type for the response object to allow for type checking.
    type PreferenceResponse = {
      CurrencyPrefs: {
        MultiCurrencyEnabled: boolean;
      };
    };

    // Query user preferences to get the multi-currency preference for the user.
    const preferences: PreferenceResponse = await new Promise((resolve) => {
      qbo.getPreferences((err: Error, data: PreferenceResponse) => {
        // If there is an error, check if it has a 'Fault' property
        if (err && checkFaultProperty(err)) {
          // If there was an error getting the preferences, set the multi-currency preference to false.
          resolve({ CurrencyPrefs: { MultiCurrencyEnabled: false } });
        }
        // If there is no error, resolve the data to allow the caller to access the results.
        resolve(data);
      });
    });

    // Get the current date.
    const today = new Date();

    // If there is no start date passed to the function, define the default start date.
    // Current default value: 2 years ago.
    if (startDate === '') {
      const TwoYearsAgo = new Date(
        today.getFullYear() - 2,
        today.getMonth(),
        today.getDate()
      );
      // Convert the date object into the correct format for the API.
      startDate = TwoYearsAgo.toISOString().split('T')[0];
    }

    // If there is no end date, set the end date to the current date.
    if (endDate === '') {
      // Convert the date object into the correct format for the API.
      endDate = today.toISOString().split('T')[0];
    }

    // Defines the start date, end date, maximum returned transactions.
    // Also defines a list of the relevant data columns to include for each report.
    const parameters = {
      start_date: startDate,
      end_date: endDate,
      limit: 1000,
      columns: ['account_name', 'name', 'other_account', 'tx_date', 'txn_type'],
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

    // Call API to get a list of transaction using the set parameters.
    const response: TransactionResponse = await new Promise((resolve) => {
      qbo.reportTransactionList(
        parameters,
        (err: Error, data: TransactionResponse) => {
          // If there is an error, check if it has a 'Fault' property
          if (err && checkFaultProperty(err)) {
            // Set the success tracker to false to indicate an error occurred.
            success = false;
          }
          // Resolve the data to allow the caller to access the results.
          resolve(data);
        }
      );
    });

    // Get the results rows from the JSON response.
    const results = response.Rows.Row;

    // Create an empty array to hold the formatted transactions.
    const formattedTransactions = [];

    // Create a formatted result object based on the query results.
    const QueryResult = createQueryResult(success, response);

    // Add the formatted result to the start of accounts array as error indication.
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
      // For each account object create a formatted transaction object and add it to the array.
      for (const transaction of results) {
        // Check if the transaction is a summary row and skip it.
        if (transaction.Summary) {
          break;
        }
        const dateRow = 0;
        const transactionRow = 1;
        const nameRow = 2;
        const accountRow = 3;
        const categoryRow = 4;
        const amountRow = 5;

        // Check account fields to skip any transactions missing required values.
        // Skip no-name transactions, transactions without an account, and transactions without an amount.
        if (
          purchaseTransactions.includes(String(transaction.ColData[1].value)) &&
          transaction.ColData[nameRow].value !== '' &&
          transaction.ColData[amountRow].value !== ''
        ) {
          // Create a new formatted transaction object with the necessary fields.
          // Reads the values from the specified columns in the current row of the results.
          // Defines the types for the values in the transaction object due to values from the API being either a string or number.
          const newFormattedTransaction: Transaction = {
            date: String(transaction.ColData[dateRow].value),
            transaction_type: String(transaction.ColData[transactionRow].value),
            transaction_ID: String(transaction.ColData[transactionRow].id),
            name: String(transaction.ColData[nameRow].value),
            account: String(transaction.ColData[accountRow].value),
            category: String(transaction.ColData[categoryRow].value),
            amount: Number(transaction.ColData[amountRow].value),
          };

          // Add the new formatted transaction to the formatted transactions array.
          formattedTransactions.push(newFormattedTransaction);
        }
      }
    }
    // Return the formatted results as a JSON string.
    return JSON.stringify(formattedTransactions);
  } catch (error) {
    // Return any caught errors.
    return JSON.stringify(error);
  }
}

// Find a specific purchase object by its ID.
export async function findPurchases(
  id: string,
  formatResult: boolean
): Promise<string | Purchase> {
  try {
    // Create the QuickBooks API object.
    const qbo = await createQBObject();

    // Create tracker to indicate if the query was successful or not.
    let success = true;

    // Search by ID for a specific purchase object.
    const response: PurchaseResponse = await new Promise((resolve) => {
      qbo.getPurchase(id, (err: Error, data: PurchaseResponse) => {
        // If there is an error, check if it has a 'Fault' property
        if (err && checkFaultProperty(err)) {
          // Set the success tracker to false to indicate an error occurred.
          success = false;
        }
        // Resolve the data to allow the caller and the result formatter to access the results.
        resolve(data);
      });
    });

    // If the user does not want a formatted result, return the raw response.
    // This is primarily used for updating the purchase classification.
    if (!formatResult) {
      return JSON.stringify(response);
    } else {
      // ** Call to unused functionality to return a formatted purchase result. **
      return JSON.stringify(createFormattedPurchase(success, response));
    }
  } catch (error) {
    // Return any caught errors.
    return JSON.stringify(error);
  }
}

function createFormattedPurchase(
  success: boolean,
  response: PurchaseResponse
): Purchase {
  // Create a formatted result object based on the query results.
  const queryResult = createQueryResult(success, response);

  // Create a formatted result object with all fields set to null.
  const formattedResult: Purchase = {
    result_info: queryResult,
    id: '',
    purchase_type: '',
    date: '',
    total: 0,
    primary_account: '',
    purchase_name: '',
    purchase_category: '',
  };

  // Check that the search was successful before updating the formatted results.
  if (success) {
    // If the results do not contain a fault, update the formatted results with the necessary fields.
    formattedResult.id = response.Id;
    formattedResult.purchase_type = response.PaymentType;
    formattedResult.date = response.TxnDate;
    formattedResult.total = response.TotalAmt;
    formattedResult.primary_account = response.AccountRef.name;
    formattedResult.purchase_name = response.EntityRef.name;
    // Initially the purchase category is set to None, as it is not always present in the results.
    formattedResult.purchase_category = 'None';

    // Iterate through the line field for the purchase category.
    for (const line of response.Line) {
      // If the purchase category is present, it is found in the AccountBasedExpenseLineDetail field.
      if (line.DetailType === 'AccountBasedExpenseLineDetail') {
        // If the purchase category is present, update the related field of the formatted results.
        formattedResult.purchase_category =
          line.AccountBasedExpenseLineDetail.AccountRef.value;
        // Once the category is found, break the loop to prevent further iterations.
        break;
      }
    }
  }
  // Return the formatted results as a JSON string.
  return formattedResult;
}

// Update a specific purchase object passed to the function.
// Takes a new account ID string and the raw purchase data to update.
// Defines the relevant structure of the purchase object in the function definition.
export async function updatePurchase(purchase: {
  Id: string;
  SyncToken: string;
  PaymentType: string;
  Line: unknown;
}): Promise<string> {
  try {
    // Create the QuickBooks API object.
    const qbo = await createQBObject();

    const purchaseInfo = {
      Id: purchase.Id,
      SyncToken: purchase.SyncToken,
      PaymentType: purchase.PaymentType,
      Line: purchase.Line,
    };

    // Update the purchase object with the updated account values.
    await new Promise((resolve, reject) => {
      qbo.updatePurchase(purchaseInfo, (err: Error, data: unknown) => {
        // If there is an error, reject the promise and return the error.
        if (err) {
          reject(err);
        }
        resolve(data);
      });
    });

    // Return the formatted and updated purchase as a JSON string.
    return JSON.stringify(purchase);
  } catch (error) {
    // Return any caught errors.
    return JSON.stringify(error);
  }
}

// Find a the company info object and return the industry.
export async function findIndustry(): Promise<string> {
  try {
    // Create the QuickBooks API object.
    const qbo = await createQBObject();

    // Create a type for the response object to allow for type checking.
    type CompanyInfoResponse = {
      QueryResponse: {
        CompanyInfo: [
          {
            NameValue: [
              {
                Name: string;
                Value: string;
              },
            ];
          },
        ];
      };
    };

    // Search for any company info objects related to the user.
    const response: CompanyInfoResponse = await new Promise((resolve) => {
      qbo.findCompanyInfos((err: Error, data: CompanyInfoResponse) => {
        // If there is an error, check if it has a 'Fault' property
        if (err && checkFaultProperty(err)) {
          // Then resolve the function with a response with values formatted to indicate failure.
          resolve({
            QueryResponse: {
              CompanyInfo: [{ NameValue: [{ Name: '', Value: '' }] }],
            },
          });
        }
        // If there is no error, resolve the data to allow the caller to access the results.
        resolve(data);
      });
    });

    // Get array containing the industry type data from the company info.
    const companyNameValueArray =
      response.QueryResponse.CompanyInfo[0].NameValue;

    // Iterate through the array to find the industry type.
    for (const item of companyNameValueArray) {
      // If the industry type is found, return it to the caller.
      if (item.Name === 'QBOIndustryType' || item.Name === 'IndustryType') {
        return item.Value;
      }
    }

    // Return none, if no match was found.
    return 'None';
  } catch (error) {
    // Log the error.
    console.error('Error finding industry:', error);
    // Return error message if the call fails.
    return 'Error';
  }
}

// Create a formatted result object based on the query results.
// Takes a success boolean and the results of the query (format is defined in function definition).
function createQueryResult(
  success: boolean,
  results: { Error: { Message: string; Detail: string }[] }
): QueryResult {
  // Create a formatted result object with all fields set to null.
  const QueryResult: QueryResult = {
    result: '',
    message: '',
    detail: '',
  };

  // Check if the query was successful.
  if (success) {
    // Set the query result to indicate success and provide a success message and detail.
    QueryResult.result = 'Success';
    QueryResult.message = 'Accounts found successfully.';
    QueryResult.detail = 'The account objects were found successfully.';
  } else {
    // Otherwise, set the query result to indicate failure and provide a error message and detail.
    QueryResult.result = 'Error';
    QueryResult.message = results.Error[0].Message;
    QueryResult.detail = results.Error[0].Detail;
  }

  // Return the formatted query result.
  return QueryResult;
}

// Get the company name from the QuickBooks API.
export async function getCompanyName(): Promise<string> {
  try {
    // Create the QuickBooks API object.
    const qbo = await createQBObject();

    // Create a type for the response object to allow for type checking.
    type CompanyInfoResponse = {
      QueryResponse: { CompanyInfo: [{ CompanyName: string }] };
    };

    // Search for any company info objects.
    const response: CompanyInfoResponse = await new Promise((resolve) => {
      qbo.findCompanyInfos((err: Error, data: CompanyInfoResponse) => {
        // If there is an error, check if it has a 'Fault' property
        if (err && checkFaultProperty(err)) {
          // Then resolve the function with a response with values formatted to indicate failure.
          resolve({
            QueryResponse: {
              CompanyInfo: [{ CompanyName: 'Error: Name not found' }],
            },
          });
        }
        // If there is no error, resolve the data to allow the caller to access the results.
        resolve(data);
      });
    });

    // Get the company name from the JSON response and convert it to a string.
    const companyName = JSON.stringify(
      response.QueryResponse.CompanyInfo[0].CompanyName
    );

    // Return the name value with the surrounding quotation marks removed.
    return companyName.slice(1, -1);
  } catch (error) {
    // Log thew error.
    console.error('Error finding company name:', error);
    // Return an error string to display if the call fails.
    return 'Error: Name not found';
  }
}
