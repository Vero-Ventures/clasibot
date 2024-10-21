'use server';
import { createQBObject, createQBObjectWithSession } from '@/actions/qb-client';
import { checkFaultProperty, createQueryResult } from './query-helpers';
import type { ErrorResponse } from '@/types/ErrorResponse';
import type { Purchase, PurchaseResponse } from '@/types/Purchase';
import type { Session } from 'next-auth/core/types';

// Find a specific purchase object by its QuickBooks ID and return a formatted Purchase object.
// May take a synthetic login session to use instead of the regular session.
export async function findFormattedPurchase(
  id: string,
  session: Session | null = null
): Promise<Purchase> {
  try {
    // Define the variable used to make the qbo calls.
    let qbo;

    // Check if a session was passed by a backend function to use to define the qbo object.
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

    // Search for a specific purchase object by the passed purchase Id.
    const response: PurchaseResponse = await new Promise((resolve) => {
      qbo.getPurchase(id, (err: ErrorResponse, data: PurchaseResponse) => {
        // If there is an error, check if it has a 'Fault' property
        if (err && checkFaultProperty(err)) {
          // Define success as false and record the error.
          success = false;
          error = err;
        }
        resolve(data);
      });
    });

    // Create a formatted Query Result object for the QBO API call.
    const queryResult = createQueryResult(success, error);

    // Create a formatted result object with all fields set to null.
    // Set the results info field of the purchase to the created Query Result.
    const formattedResult: Purchase = {
      result_info: queryResult,
      id: '',
      taxCodeId: '',
    };

    // If the query did not encounter an error, get the Id from the response and update the formatted result object.
    if (success) {
      formattedResult.id = response.Id;
      // Iterate through the line field for the tax code ID.
      // If the tax code is present, it is found in the AccountBasedExpenseLineDetail field.
      for (const line of response.Line) {
        if (line.DetailType === 'AccountBasedExpenseLineDetail') {
          // Set the formatted result objects taxCodeId from the current line and break the loop.
          formattedResult.taxCodeId =
            line.AccountBasedExpenseLineDetail.TaxCodeRef.value;
          break;
        }
      }
    }
    // Return the formatted Purchase object as a JSON string.
    return formattedResult;
  } catch (error) {
    // Return an empty formatted Purchase object with an error Query Result in the results info.
    // Include a detail string if error message is present.
    if (error instanceof Error) {
      return {
        result_info: {
          result: 'error',
          message: 'Unexpected error occured while fetching purchases.',
          detail: error.message,
        },
        id: '',
        taxCodeId: '',
      };
    } else {
      return {
        result_info: {
          result: 'error',
          message: 'Unexpected error occured while fetching purchases.',
          detail: 'N/A',
        },
        id: '',
        taxCodeId: '',
      };
    }
  }
}
