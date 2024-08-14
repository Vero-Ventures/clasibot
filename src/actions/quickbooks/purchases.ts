'use server';
import { createQBObject } from '../qb-client';
import { checkFaultProperty, createQueryResult } from './helpers';
import { Purchase } from '@/types/Purchase';
import { PurchaseResponse } from '@/types/PurchaseResponse';

// Find a specific purchase object by its ID.
export async function findPurchases(id: string): Promise<PurchaseResponse> {
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

    return response;
  } catch (error) {
    console.error(error);
    // Return an empty purchase response that indicates an error.
    const errorResonse: PurchaseResponse = {
      Id: '',
      SyncToken: '',
      PaymentType: '',
      TxnDate: '',
      TotalAmt: 0,
      AccountRef: { value: '', name: '' },
      EntityRef: { value: '', name: '' },
      Line: [
        {
          DetailType: '',
          AccountBasedExpenseLineDetail: {
            AccountRef: { value: '', name: '' },
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
