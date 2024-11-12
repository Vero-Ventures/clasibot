'use server';
import { checkFaultProperty, createQueryResult } from './index';
import { getQBObject, getQBObjectWithSession } from '@/actions/qb-client';
import type { ErrorResponse, LoginTokens, Purchase } from '@/types/index';

// Find a specific Purchase by its QuickBooks Id and return a formatted Purchase object.
// Takes: The Id of the Purchase to find from QuickBooks
//    May also take synthetic Login Tokens and Company realm Id for backend calls.
export async function findFormattedPurchase(
  id: string,
  loginTokens: LoginTokens | null = null,
  companyId: string | null = null
): Promise<Purchase> {
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

    // Define a type for the response object to allow for type checking.
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

    // Search for a specific Purchase object using the passed Purchase Id.
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

    // Create a Purchase object with all fields set to null.
    //    Only one Purchase is returned per call, so the Query Result is recorded inside the object.
    const formattedResult: Purchase = {
      result_info: queryResult,
      id: '',
      taxCodeId: '',
    };

    // If the query did not encounter an error, get the Id from the response and update the Purchase object.
    if (success) {
      formattedResult.id = response.Id;
      // Iterate through the line field to find the Tax Code Id.
      // If present the Tax Code is found in the 'AccountBasedExpenseLineDetail' field.
      for (const line of response.Line) {
        if (line.DetailType === 'AccountBasedExpenseLineDetail') {
          // Set the Purchase taxCodeId using the value found within the line and break the loop to stop looking.
          formattedResult.taxCodeId =
            line.AccountBasedExpenseLineDetail.TaxCodeRef.value;
          break;
        }
      }
    }
    // Return the formatted Purchase object as a JSON string.
    return formattedResult;
  } catch (error) {
    // Catch any errors and return an error Query Result, include the error message if it is present.
    // Include Query Result in the result_info field of an empty Purchase to match expected return typing.
    if (error instanceof Error) {
      return {
        result_info: {
          result: 'error',
          message: 'Unexpected error occured while fetching Purchase.',
          detail: error.message,
        },
        id: '',
        taxCodeId: '',
      };
    } else {
      return {
        result_info: {
          result: 'error',
          message: 'Unexpected error occured while fetching Purchase.',
          detail: 'N/A',
        },
        id: '',
        taxCodeId: '',
      };
    }
  }
}
