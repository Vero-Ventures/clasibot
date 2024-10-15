'use server';

import { createQBObject, createQBObjectWithSession } from '@/actions/qb-client';
import { checkFaultProperty, createQueryResult } from './helpers';
import type { Session } from 'next-auth/core/types';
import type { ErrorResponse } from '@/types/ErrorResponse';
import type { Purchase, PurchaseResponse } from '@/types/Purchase';

// Find a specific purchase object by its ID and return a formatted result.
export async function findFormattedPurchase(
  id: string,
  session: Session | null = null
): Promise<Purchase> {
  // Define the variable used to make the qbo calls.
  let qbo;

  // Check if a session was passed to use to define the qbo object.
  // Then define the qbo object based on the session presence.
  if (session) {
    qbo = await createQBObjectWithSession(session);
  } else {
    qbo = await createQBObject();
  }

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

  // Search by ID for a specific purchase object.
  const response: PurchaseResponse = await new Promise((resolve) => {
    qbo.getPurchase(id, (err: ErrorResponse, data: PurchaseResponse) => {
      // If there is an error, check if it has a 'Fault' property
      if (err && checkFaultProperty(err)) {
        success = false;
        error = err;
      }
      resolve(data);
    });
  });

  // Create a formatted result object based on the query results.
  const queryResult = createQueryResult(success, error);

  // Create a formatted result object with all fields set to null.
  const formattedResult: Purchase = {
    result_info: queryResult,
    id: '',
    taxCodeId: '',
  };

  if (success) {
    formattedResult.id = response.Id;
    // Iterate through the line field for the tax code ID.
    for (const line of response.Line) {
      // If the tax code is present, it is found in the AccountBasedExpenseLineDetail field.
      if (line.DetailType === 'AccountBasedExpenseLineDetail') {
        formattedResult.taxCodeId =
          line.AccountBasedExpenseLineDetail.TaxCodeRef.value;
        // Once the category is found, break the loop to prevent further iterations.
        break;
      }
    }
  }
  // Return the formatted results as a JSON string.
  return formattedResult;
}

// Gets purchases and returns them as an array of purchase response objects.
export async function getPurchases(): Promise<Purchase[]> {
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

    // Define a type for the wrapper of the purchase response objects in the findPurchases response.
    type PurchasesResponseArray = {
      QueryResponse: { Purchase: PurchaseResponse[] };
    };

    // Get all purchase objects.
    const response: PurchasesResponseArray = await new Promise((resolve) => {
      qbo.findPurchases((err: ErrorResponse, data: PurchasesResponseArray) => {
        if (err && checkFaultProperty(err)) {
          // If there was an error getting the purchase (with a fault property), throw an error.
          error = err;
          success = false;
        }
        resolve(data);
      });
    });

    // Create a formatted result object based on the query results.
    const queryResult = createQueryResult(success, error);

    // Create an array to store the purchase responses.
    // Query result is not used to keep purchases in format needed for purchase updates.
    const purchases: Purchase[] = [];

    // Iterate through the response to add the individal purchases to the purchases array.
    // Preforms checks to remove irrelevant purchases and format missing data for optional values.
    for (const purchase of response.QueryResponse.Purchase) {
      const formattedResult: Purchase = {
        result_info: queryResult,
        id: '',
        taxCodeId: '',
      };

      formattedResult.id = purchase.Id;
      // Iterate through the line field for the tax code ID.
      for (const line of purchase.Line) {
        // If the tax code is present, it is found in the AccountBasedExpenseLineDetail field.
        if (line.DetailType === 'AccountBasedExpenseLineDetail') {
          formattedResult.taxCodeId =
            line.AccountBasedExpenseLineDetail.TaxCodeRef.value;
          // Once the category is found, break the loop to prevent further iterations.
          break;
        }
      }
      // Return the formatted results as a JSON string.
      purchases.push(formattedResult);
    }

    // Return the relevant values from the purchases using the array of purchase response objects.
    return purchases;
  } catch (error) {
    console.error(error);
    // Return an empty purchase response inside and array to indicate an error.
    if (error instanceof Error) {
      return [
        {
          result_info: {
            result: 'Error',
            message: 'Failed to fetch purchases',
            detail: error.message,
          },
          id: '',
          taxCodeId: '',
        },
      ];
    } else {
      return [
        {
          result_info: {
            result: 'Error',
            message: 'Failed to fetch purchases',
            detail: '',
          },
          id: '',
          taxCodeId: '',
        },
      ];
    }
  }
}

// Update a specific purchase object passed to the function.
// Unused function kept for possible re-implementation.
export async function updatePurchase(
  purchase: PurchaseResponse
): Promise<string> {
  try {
    // Create the QuickBooks API object.
    const qbo = await createQBObject();

    // Define the relevant purchase information needed to call the update function.
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
