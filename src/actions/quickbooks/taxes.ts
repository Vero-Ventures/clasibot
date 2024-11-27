'use server';

import { checkFaultProperty, createQueryResult } from './index';

import { getQBObject } from '@/actions/qb-client';

import { TaxCodes, LocationsToTaxCodes } from '@/enums/tax-codes';
import type { Locations } from '@/enums/tax-codes';

import type { ErrorResponse, TaxCode } from '@/types/index';

// Get all valid Canadian Tax Codes for a User location.
// Returns: An array of Tax Code objects as a string.
export async function getTaxCodes(): Promise<string> {
  try {
    // Define the variable used to make the qbo calls.
    const qbo = await getQBObject();

    // Define a type for the QBO response to allow for type checking.
    type TaxCodeResponse = {
      QueryResponse: { TaxCode: TaxCode[] };
      Error: {
        Message: string;
        Detail: string;
      }[];
    };

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

    // Get all User Tax Code objects from QuickBooks.
    const response: TaxCodeResponse = await new Promise((resolve) => {
      qbo.findTaxCodes((err: ErrorResponse, data: TaxCodeResponse) => {
        if (err && checkFaultProperty(err)) {
          // Define success as false and record the error.
          success = false;
          error = err;
        }
        resolve(data);
      });
    });

    // Create an array to store the Tax Code objects.
    const results = [];

    // Create a formatted Query Result object for the QBO API call.
    // Push the Query Result to the first index of the results array.
    const queryResult = createQueryResult(success, error);
    results.push(queryResult);

    // Iterate through the responses to filter, format, and push the Tax Codes to the array.
    for (const taxCode of response.QueryResponse.TaxCode) {
      // Ignore inactive Tax Codes, then filter out invalid Tax Codes.
      //    Filters out non-Canadian Tax Codes and Canadian Tax Codes that are no longer in use.
      if (taxCode.Active === true && checkForCurrentTaxCode(taxCode.Name)) {
        // Call helper method to format the Tax Code, then push it to the results array.
        results.push(formatTaxCode(taxCode));
      }
    }

    // Return the array with the Query Result and Tax Code objects as a JSON string.
    return JSON.stringify(results);
  } catch (error) {
    // Catch any errors and return an error Query Result, include the error message if it is present.
    if (error instanceof Error) {
      return JSON.stringify({
        result: 'error',
        message: 'Unexpected error occured while fetching Accounts.',
        detail: error.message,
      });
    } else {
      return JSON.stringify({
        result: 'error',
        message: 'Unexpected error occured while fetching Accounts.',
        detail: 'N/A',
      });
    }
  }
}

// Finds the valid Tax Codes for a User by their specific Canadian Sub-location.
// Takes: A Canadian sub-location name defined by the Locations enum.
// Returns: An array of the Tax Code names used by the Sub-location.
export async function getTaxCodesByLocation(
  LocationName: Locations
): Promise<string[]> {
  // Define the array of valid Tax Code name strings for the country Canada.
  const taxCodeNames = LocationsToTaxCodes.Canada;

  // Check for Sub-locational Tax Code and save them.
  const subLocationCodes = LocationsToTaxCodes[LocationName];

  // If Sub-location codes are found, push them onto the array of Tax Code strings.
  if (subLocationCodes) {
    // Push the array of strings for the sub-location onto the existing array.
    taxCodeNames.push(...subLocationCodes);
  }

  // Return the array of Tax Code names.
  return taxCodeNames;
}

// Converts QuickBooks Tax Codes to a formatted Tax Code objects.
// Takes: A QuickBooks Tax Code object.
// Returns: A formatted Tax Code object.
function formatTaxCode(taxCodeResponse: TaxCode): TaxCode {
  // Create object with relevant elements from the passed raw API Tax Code object.
  const formattedTaxCode: TaxCode = {
    Id: taxCodeResponse.Id,
    Name: taxCodeResponse.Name,
    Active: taxCodeResponse.Active,
  };

  // Return the formatted Tax Code object.
  return formattedTaxCode;
}

// Check Tax Code names to see if they are currently valid for use.
// Takes: A Tax Code name as a string.
// Returns: The Tax Code validity as a boolean value.
function checkForCurrentTaxCode(taxCodeName: string): boolean {
  // Check the Tax Code name against the Enum of valid Tax Codes.
  return (Object.values(TaxCodes) as string[]).includes(taxCodeName);
}
