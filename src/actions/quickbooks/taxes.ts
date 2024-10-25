'use server';
import { getQBObject, getQBObjectWithSession } from '@/actions/qb-client';
import { checkFaultProperty, createQueryResult } from './query-helpers';
import { Locations, TaxCodes } from '@/enums/taxes';
import type { ErrorResponse } from '@/types/ErrorResponse';
import type { TaxCode } from '@/types/TaxCode';
import type { LoginTokens } from '@/types/LoginTokens';

// Get all valid Canadian tax codes for a User location.
// Takes: An optional set of Login Tokens and a Company realm Id.
// Returns: An array of Tax Code objects as a string.
export async function getTaxCodes(
  loginTokens: LoginTokens | null = null,
  companyId: string | null = null
): Promise<string> {
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
        message: 'Unexpected error occured while fetching accounts.',
        detail: error.message,
      });
    } else {
      return JSON.stringify({
        result: 'error',
        message: 'Unexpected error occured while fetching accounts.',
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
  // Define the array of valid Tax Code name strings.
  const taxCodeNames = [];

  // Add the standard nation wide Tax Codes that apply a 0% rate.
  taxCodeNames.push(TaxCodes.Exempt, TaxCodes.ZeroRated, TaxCodes.OutOfScope);

  // Add the nation wide GST Tax Code.
  taxCodeNames.push(TaxCodes.Gst);

  // Use switch case to determine and add appropriate Tax Codes by location.
  // Alberta and the Territories (NU, NW, YK) have not additional Tax Codes.
  switch (LocationName) {
    case Locations.BC:
      taxCodeNames.push(TaxCodes.GstPstBC, TaxCodes.PstBC);
      break;
    case Locations.MB:
      taxCodeNames.push(TaxCodes.GstPstMB, TaxCodes.PstMB);
      break;
    case Locations.SK:
      taxCodeNames.push(TaxCodes.GstPstSK, TaxCodes.PstSk);
      break;
    case Locations.QC:
      taxCodeNames.push(TaxCodes.GstQstQC, TaxCodes.QstQC);
      break;
    case Locations.NS:
      taxCodeNames.push(TaxCodes.HstNS);
      break;
    case Locations.ON:
      taxCodeNames.push(TaxCodes.HstON);
      break;
    case Locations.NB:
      taxCodeNames.push(TaxCodes.HstNB);
      break;
    case Locations.NL:
      taxCodeNames.push(TaxCodes.HstNL);
      break;
    case Locations.PE:
      taxCodeNames.push(TaxCodes.HstPE);
      break;
  }

  // Return the array of Tax Code names.
  return taxCodeNames;
}

// Take a Tax Code response from QuickBooks and converts it to a formatted Tax Code object.
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

// Takes a Tax Code name and check if it currently valid for use.
// Returns: The Tax Code validity as a boolean value.
function checkForCurrentTaxCode(taxCodeName: string): boolean {
  // Check the Tax Code name against the Enum of valid Tax Codes.
  return (Object.values(TaxCodes) as string[]).includes(taxCodeName);
}
