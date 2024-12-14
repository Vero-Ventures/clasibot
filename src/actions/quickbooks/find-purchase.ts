'use server';

import { checkFaultProperty, createQueryResult } from '@/actions/helpers/index';

import { getQBObject } from '@/actions/quickbooks/qb-client';

import type { ErrorResponse, Purchase } from '@/types/index';

// Takes: The Id of the Purchase to find from QuickBooks.
export async function findFormattedPurchase(id: string): Promise<Purchase> {
  try {
    // Define the variable used to make the QBO calls.
    const qbo = await getQBObject();

    // Define a success tracking value used in error handling.
    let success = true;

    // Also define the format of the QuickBooks data and error response objects.
    type PurchaseResponse = {
      Id: string;
      Line: [
        {
          DetailType: string;
          AccountBasedExpenseLineDetail: {
            TaxCodeRef: { value: string; name: string };
          };
        },
      ];
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

    // Search for a specific QuickBooks Purchase using the passed Purchase Id.
    const response: PurchaseResponse = await new Promise((resolve) => {
      qbo.getPurchase(id, (err: ErrorResponse, data: PurchaseResponse) => {
        // If there is an error, check if it has a 'Fault' property
        if (err && checkFaultProperty(err)) {
          // Set the success value to false and record the error.
          success = false;
          error = err;
        }
        resolve(data);
      });
    });

    // Create a formatted Query Result object using the success value and potential error object.
    const queryResult = createQueryResult(success, error);

    // Create a Purchase with all fields set to null.
    // Only the single Purchase object is returned, so the Query Result is recorded inside the Purchase.
    const formattedResult: Purchase = {
      resultInfo: queryResult,
      id: '',
      taxCodeId: '',
    };

    // If the call was successful, get the Id from the response and update the Purchase.
    if (success) {
      formattedResult.id = response.Id;
      // Iterate through the line field of the response to find the Tax Code Id.
      // If present, the Tax Code is found in the 'AccountBasedExpenseLineDetail' field.
      for (const line of response.Line) {
        if (line.DetailType === 'AccountBasedExpenseLineDetail') {
          // Set the Purchase taxCodeId and stop iteration.
          formattedResult.taxCodeId =
            line.AccountBasedExpenseLineDetail.TaxCodeRef.value;
          break;
        }
      }
    }

    // Return the formatted Purchase with the Query Result inside.
    return formattedResult;
  } catch (error) {
    // Catch any errors and return an error Query Result, include the error message if it is present.
    // Includes the Query Result in the resultInfo field of an empty Purchase to match expected return typing.
    if (error instanceof Error) {
      return {
        resultInfo: {
          result: 'Error',
          message: 'Unexpected error occured while fetching Purchase.',
          detail: error.message,
        },
        id: '',
        taxCodeId: '',
      };
    } else {
      return {
        resultInfo: {
          result: 'Error',
          message: 'Unexpected error occured while fetching Purchase.',
          detail: 'N/A',
        },
        id: '',
        taxCodeId: '',
      };
    }
  }
}
