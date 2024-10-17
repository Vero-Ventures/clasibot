'use server';
import { createQBObject, createQBObjectWithSession } from '@/actions/qb-client';
import { checkFaultProperty, createQueryResult } from './query-helpers';
import type { Session } from 'next-auth/core/types';
import type { TaxCode } from '@/types/TaxCode';
import type { ErrorResponse } from '@/types/ErrorResponse';
import { Locations, TaxCodes } from '@/enums/taxes';

// Get all the tax codes and returns them as an array of tax code objects.
// May take a synthetic login session to use instead of the regular session.
export async function getTaxCodes(
  session: Session | null = null
): Promise<string> {
  try {
    // Define the variable used to make the qbo calls.
    let qbo;

    // Check if a session was passed by a backend function to be used to define the qbo object.
    // Then create the qbo object for frontend or backend functions based on the session presence.
    if (session) {
      qbo = await createQBObjectWithSession(session);
    } else {
      qbo = await createQBObject();
    }

    // Define format of returned group of tax code objects.
    type TaxCodeResponse = {
      QueryResponse: { TaxCode: TaxCode[] };
      Error: {
        Message: string;
        Detail: string;
      }[];
    };

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

    // Get all tax code objects.
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

    // Create an array to store the tax codes.
    const taxCodes = [];

    // Create a formatted Query Result object for the QBO API call then push it to the first index of the tax code array.
    const queryResult = createQueryResult(success, error);
    taxCodes.push(queryResult);

    // Iterate through the response to format and add the individal tax codes to the array.
    for (const taxCode of response.QueryResponse.TaxCode) {
      // Ignore inactive tax codes and filter to valid tax codes by name.
      if (taxCode.Active === true && checkForCurrentTaxCode(taxCode.Name)) {
        taxCodes.push(formatTaxCode(taxCode));
      }
    }

    // Return the array of a query result and the formatted tax codes as a JSON string.
    return JSON.stringify(taxCodes);
  } catch (error) {
    // Return a query result formatted error message.
    // Include a detail string if error message is present.
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

// Get an array of the tax code names used by a specific location (province or territory).
export async function getTaxCodesByLocation(
  LocationName: Locations
): Promise<string[]> {
  const taxCodeNames = [];
  // Push the nation wide tax codes that apply a 0% rate.
  taxCodeNames.push(TaxCodes.Exempt, TaxCodes.ZeroRated, TaxCodes.OutOfScope);

  // Push the nation wide GST tax code.
  taxCodeNames.push(TaxCodes.Gst);

  // Use switch case to add appropriate tax codes by location.
  // Alberta and the territories have not additional tax codes.
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

  // Return the array of tax code names.
  return taxCodeNames;
}

// Take a tax code response from the API and format it by grabbing the relevant values from the whole response.
function formatTaxCode(taxCodeResponse: TaxCode): TaxCode {
  // Create object with relevant elements from passed raw API tax code object.
  const formattedTaxCode: TaxCode = {
    Id: taxCodeResponse.Id,
    Name: taxCodeResponse.Name,
    Description: taxCodeResponse.Description,
    Active: taxCodeResponse.Active,
    TaxGroup: taxCodeResponse.TaxGroup,
    PurchaseTaxRateList: taxCodeResponse.PurchaseTaxRateList,
  };

  // Return the formatted object just containing the relevant data.
  return formattedTaxCode;
}

// Take a tax code name and check if it currently valid for use.
function checkForCurrentTaxCode(taxCodeName: string): boolean {
  // Check the tax code name against the Enum of valid tax codes.
  return (Object.values(TaxCodes) as string[]).includes(taxCodeName);
}
