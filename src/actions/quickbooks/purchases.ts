'use server';
import { createQBObject } from '../qb-client';
import { checkFaultProperty, createQueryResult } from './helpers';
import type { Purchase } from '@/types/Purchase';
import type { PurchaseResponse } from '@/types/PurchaseResponse';

// Find a specific purchase object by its ID.
export async function findPurchase(id: string): Promise<PurchaseResponse> {
  try {
    // Create the QuickBooks API object.
    const qbo = await createQBObject();

    // Search by ID for a specific purchase object.
    const response: PurchaseResponse = await new Promise((resolve) => {
      qbo.getPurchase(id, (err: Error, data: PurchaseResponse) => {
        if (err && checkFaultProperty(err)) {
          // If there was an error getting the purchase (with a fault property), throw an error.
          throw new Error('Error finding purchase');
        }
        resolve(data);
      });
    });

    // Filter to only purchase response values before returning.
    return filterToPurchaseResponse(response);
  } catch (error) {
    console.error(error);
    // Return an empty purchase response that indicates an error.
    // Query result is not used to keep purchases in format needed for purchase updates.
    const errorResonse: PurchaseResponse = {
      Id: '',
      SyncToken: '',
      TxnDate: '',
      PaymentType: '',
      Credit: false,
      TotalAmt: 0,
      AccountRef: { value: '', name: '' },
      EntityRef: { value: '', name: '', type: '' },
      Line: [
        {
          DetailType: '',
          Description: '',
          Amount: 0,
          AccountBasedExpenseLineDetail: {
            AccountRef: { value: '', name: '' },
            TaxCodeRef: { value: '', name: '' },
          },
        },
      ],
      Error: [{ Message: 'Error', Detail: 'Error finding purchase' }],
    };
    return errorResonse;
  }
}

// Find a specific purchase object by its ID and return a formatted result.
export async function getFormattedPurchase(id: string): Promise<Purchase> {
  // Create the QuickBooks API object.
  const qbo = await createQBObject();
  let success = true;

  // Search by ID for a specific purchase object.
  const response: PurchaseResponse = await new Promise((resolve) => {
    qbo.getPurchase(id, (err: Error, data: PurchaseResponse) => {
      // If there is an error, check if it has a 'Fault' property
      if (err && checkFaultProperty(err)) {
        success = false;
      }
      resolve(data);
    });
  });

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

  if (success) {
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

// Gets purchases and returns them as an array of purchase response objects.
export async function getPurchases(): Promise<PurchaseResponse[]> {
  try {
    // Create the QuickBooks API object.
    const qbo = await createQBObject();

    // Define a type for the wrapper of the purchase response objects in the findPurchases response.
    type PurchasesResponseArray = {
      QueryResponse: { Purchase: PurchaseResponse[] };
    };

    // Get all purchase objects.
    const response: PurchasesResponseArray = await new Promise(
      (resolve, reject) => {
        qbo.findPurchases((err: Error, data: PurchasesResponseArray) => {
          if (err && checkFaultProperty(err)) {
            // If there was an error getting the purchase (with a fault property), throw an error.
            reject(err);
          }
          resolve(data);
        });
      }
    );

    // Create an array to store the purchase responses.
    // Query result is not used to keep purchases in format needed for purchase updates.
    const purchases: PurchaseResponse[] = [];

    // Iterate through the response to add the individal purchases to the purchases array.
    // Preforms checks to remove irrelevant purchases and format missing data for optional values.
    for (const purchase of response.QueryResponse.Purchase) {
      // If the transaction has no related payee, entity ref will be missing.
      if (purchase.EntityRef === undefined) {
        purchase.EntityRef = { value: 'MISSING', name: 'N/A', type: 'N/A' };
      }

      // Skip transactions with item based detail types as they do not relate to expense transactions.
      // Also skip transactions where credit is true as they represent refunds and again unrelated.
      if (
        purchase.Credit !== true &&
        purchase.Line[0].DetailType !== 'ItemBasedExpenseLineDetail'
      ) {
        purchases.push(filterToPurchaseResponse(purchase));
      }
    }

    // Return the relevant values from the purchases using the array of purchase response objects.
    return purchases;
  } catch (error) {
    console.error(error);
    // Return an empty purchase response inside and array to indicate an error.
    const errorResonse: PurchaseResponse[] = [
      {
        Id: '',
        SyncToken: '',
        TxnDate: '',
        PaymentType: '',
        Credit: false,
        TotalAmt: 0,
        AccountRef: { value: '', name: '' },
        EntityRef: { value: '', name: '', type: '' },
        Line: [
          {
            DetailType: '',
            Description: '',
            Amount: 0,
            AccountBasedExpenseLineDetail: {
              AccountRef: { value: '', name: '' },
              TaxCodeRef: { value: '', name: '' },
            },
          },
        ],
        Error: [{ Message: 'Error', Detail: 'Error finding purchase' }],
      },
    ];
    return errorResonse;
  }
}

// Takes a raw purchase response from the API and creates a new purchase response object with only the needed values.
// Returned values from the API (even defined as purchase response) will include all values returned by the API.
// This function takes a raw result and uses its values to create a new object with only the desired values
function filterToPurchaseResponse(rawApiPurchase: PurchaseResponse) {
  console.log(rawApiPurchase);
  // Define a purchase response object using only the relevant values from a returned purchase response.
  const formattedPurchaseResponse: PurchaseResponse = {
    Id: rawApiPurchase.Id,
    SyncToken: rawApiPurchase.SyncToken,
    TxnDate: rawApiPurchase.TxnDate,
    PaymentType: rawApiPurchase.PaymentType,
    Credit: rawApiPurchase.Credit,
    TotalAmt: rawApiPurchase.TotalAmt,
    AccountRef: {
      value: rawApiPurchase.AccountRef.value,
      name: rawApiPurchase.AccountRef.name,
    },
    EntityRef: {
      value: rawApiPurchase.EntityRef.value,
      name: rawApiPurchase.EntityRef.name,
      type: rawApiPurchase.EntityRef.type,
    },
    Line: [
      {
        DetailType: rawApiPurchase.Line[0].DetailType,
        Description: rawApiPurchase.Line[0].Description,
        Amount: rawApiPurchase.Line[0].Amount,
        AccountBasedExpenseLineDetail: {
          AccountRef: {
            value:
              rawApiPurchase.Line[0].AccountBasedExpenseLineDetail.AccountRef
                .value,
            name: rawApiPurchase.Line[0].AccountBasedExpenseLineDetail
              .AccountRef.name,
          },
          TaxCodeRef: {
            value:
              rawApiPurchase.Line[0].AccountBasedExpenseLineDetail.TaxCodeRef
                .value,
            name: rawApiPurchase.Line[0].AccountBasedExpenseLineDetail
              .TaxCodeRef.name,
          },
        },
      },
    ],
    Error: [{ Message: '', Detail: '' }],
  };

  // If the purchase had more than one line, iterate through them and append them to the formatted purchase line value.
  if (rawApiPurchase.Line.length > 1) {
    for (let line = 1; line < rawApiPurchase.Line.length; line++) {
      formattedPurchaseResponse.Line.push({
        DetailType: rawApiPurchase.Line[line].DetailType,
        Description: rawApiPurchase.Line[line].Description,
        Amount: rawApiPurchase.Line[line].Amount,
        AccountBasedExpenseLineDetail: {
          AccountRef: {
            value:
              rawApiPurchase.Line[line].AccountBasedExpenseLineDetail.AccountRef
                .value,
            name: rawApiPurchase.Line[line].AccountBasedExpenseLineDetail
              .AccountRef.name,
          },
          TaxCodeRef: {
            value:
              rawApiPurchase.Line[line].AccountBasedExpenseLineDetail.TaxCodeRef
                .value,
            name: rawApiPurchase.Line[line].AccountBasedExpenseLineDetail
              .TaxCodeRef.name,
          },
        },
      });
    }
  }

  return formattedPurchaseResponse;
}

// Update a specific purchase object passed to the function.
export async function updatePurchase(
  purchase: PurchaseResponse
): Promise<string> {
  try {
    // Create the QuickBooks API object.
    const qbo = await createQBObject();

    // Define the relevant purchase information needed to call the update function.
    // ** Present configuration only works with the PurchaseResponse type. **
    const purchaseInfo = {
      Id: purchase.Id,
      SyncToken: purchase.SyncToken,
      PaymentType: purchase.PaymentType,
      Line: purchase.Line,
    };

    // Update the purchase object with the updated account values.
    await new Promise((resolve, reject) => {
      qbo.updatePurchase(purchaseInfo, (err: Error, data: unknown) => {
        if (err) {
          reject(err);
        }
        resolve(data);
      });
    });

    // Return the formatted and updated purchase as a JSON string.
    return JSON.stringify(purchase);
  } catch (error) {
    return JSON.stringify(error);
  }
}
