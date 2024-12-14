'use server';

import { checkFaultProperty, createQueryResult } from '@/actions/helpers/index';

import { getQBObject } from '@/actions/quickbooks/qb-client';

import { TaxCodes, LocationsToTaxCodes } from '@/enums/tax-codes';
import type { Locations } from '@/enums/tax-codes';

import type { ErrorResponse, TaxCode, QueryResult } from '@/types/index';

// Returns: An array of Tax Codes as a string.
export async function getTaxCodes(): Promise<(QueryResult | TaxCode)[]> {
  try {
    // Define the variable used to make the QBO calls.
    const qbo = await getQBObject();

    // Define a success tracking value used in error handling.
    let success = true;

    // Also defines the format of the QuickBooks data and error response objects.
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
    type TaxCodeResponse = {
      QueryResponse: { TaxCode: TaxCode[] };
      Error: {
        Message: string;
        Detail: string;
      }[];
    };

    // Fetch the Tax Codes from QuickBooks.
    const response: TaxCodeResponse = await new Promise((resolve) => {
      qbo.findTaxCodes((err: ErrorResponse, data: TaxCodeResponse) => {
        if (err && checkFaultProperty(err)) {
          // Set the success value to false and record the error.
          success = false;
          error = err;
        }
        resolve(data);
      });
    });

    // Create the results array and create a formatted Query Result for the call.
    // Push the Query Result to the first index of the results array.
    const results = [];
    const queryResult = createQueryResult(success, error);
    results.push(queryResult);

    // Iterate through the fetched Tax Codes to filter, format, and push them to the array.
    for (const taxCode of response.QueryResponse.TaxCode) {
      // Ignore inactive Tax Codes, then filter out invalid (Non-Canadian / Inactive) Tax Codes.
      if (taxCode.Active === true && checkForCurrentTaxCode(taxCode.Name)) {
        // Call helper method to format the Tax Code, then push it to the results array.
        results.push(formatTaxCode(taxCode));
      }
    }

    // Return the array of Tax Codes with the Query Result in the first index.
    return results;
  } catch (error) {
    // Catch any errors and return an error Query Result, include the error message if it is present.
    if (error instanceof Error) {
      return [
        {
          result: 'Error',
          message: 'Unexpected error occured while fetching Accounts.',
          detail: error.message,
        },
      ];
    } else {
      return [
        {
          result: 'Error',
          message: 'Unexpected error occured while fetching Accounts.',
          detail: 'N/A',
        },
      ];
    }
  }
}

// Takes: A Canadian Sub-Location name defined by the Locations enum.
// Returns: An array of the Tax Code names used by the Sub-Location.
export async function getTaxCodesByLocation(
  LocationName: Locations
): Promise<string[]> {
  // Define the array of valid Tax Code name strings for all Canadian Sub-Locations.
  const taxCodeNames = LocationsToTaxCodes.Canada;

  // Check for Sub-Locational Tax Code names and save them.
  const subLocationCodes = LocationsToTaxCodes[LocationName];

  // If Sub-Location codes are found, push them onto the array of Tax Code strings.
  if (subLocationCodes) {
    // Push the array of Tax Code names for the Sub-Location onto the existing array.
    taxCodeNames.push(...subLocationCodes);
  }

  // Return the array of Tax Code names.
  return taxCodeNames;
}

// Takes: A QuickBooks Tax Code.
// Returns: A formatted Tax Code.
function formatTaxCode(taxCodeResponse: TaxCode): TaxCode {
  // Create a Tax Code from the QuickBooks Tax Code.
  const formattedTaxCode: TaxCode = {
    Id: taxCodeResponse.Id,
    Name: taxCodeResponse.Name,
    Active: taxCodeResponse.Active,
  };

  // Return the formatted Tax Code.
  return formattedTaxCode;
}

// Takes: A Tax Code name as a string.
// Returns: The Tax Code validity as a boolean value.
function checkForCurrentTaxCode(taxCodeName: string): boolean {
  // Check the Tax Code name against the Enum of currently valid Tax Codes.
  return (Object.values(TaxCodes) as string[]).includes(taxCodeName);
}
