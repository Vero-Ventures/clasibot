'use server';
import { createQBObject } from '../qb-client';
import { checkFaultProperty, createQueryResult } from './helpers';
import type { TaxCode } from '@/types/TaxCode';
import type { ErrorResponse } from '@/types/ErrorResponse';
import { Locations, TaxCodes } from '@/enums/taxes';

// Get all the tax codes and returns them as an array of tax code objects.
export async function getTaxCodes(): Promise<string> {
  try {
    // Create the QuickBooks API object.
    const qbo = await createQBObject();

    // Define format of returned group of tax code objects.
    type TaxCodeResponse = {
      QueryResponse: { TaxCode: TaxCode[] };
      Error: {
        Message: string;
        Detail: string;
      }[];
    };

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

    // Get all tax code objects.
    const response: TaxCodeResponse = await new Promise((resolve) => {
      qbo.findTaxCodes((err: ErrorResponse, data: TaxCodeResponse) => {
        if (err && checkFaultProperty(err)) {
          success = false;
          error = err;
        }
        resolve(data);
      });
    });

    // Create an array to store the tax codes.
    const taxCodes = [];

    // Create a query result and push it to the tax codes array.
    const queryResult = createQueryResult(success, error);
    taxCodes.push(queryResult);

    // Iterate through the response to format and add the individal tax codes to the array.
    for (const taxCode of response.QueryResponse.TaxCode) {
      // Ignore inactive tax codes and filter to valid tax codes by name.
      if (taxCode.Active === true && checkForCurrentTaxCode(taxCode.Name)) {
        taxCodes.push(formatTaxCode(taxCode));
      }
    }

    // Return the array of formatted tax codes.
    return JSON.stringify(taxCodes);
  } catch (error) {
    return JSON.stringify(error);
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

// Get a specific tax code using its ID.
export async function findTaxCodebyId(id: string): Promise<string> {
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

    // Get a tax code by its ID.
    const response: TaxCode = await new Promise((resolve) => {
      qbo.getTaxCode(id, (err: ErrorResponse, data: TaxCode) => {
        if (err && checkFaultProperty(err)) {
          success = false;
          error = err;
        }
        resolve(data);
      });
    });

    // Create an array to store the tax codes.
    const taxCodeResult = [];

    // Create a query result and push it to the result array.
    const queryResult = createQueryResult(success, error);
    taxCodeResult.push(queryResult);

    // Format the response and push it to the result array.
    taxCodeResult.push(formatTaxCode(response));

    // Return the array of formatted tax codes.
    return JSON.stringify(taxCodeResult);
  } catch (error) {
    return JSON.stringify(error);
  }
}

// Get specific tax codes by matching the names of found tax codes against the passed array of tax code names.
// Only returns found matches, does not indicate if no match was found for one or more names in the passed string array.
// Returns an empty array if no matches are found.
export async function findTaxCodesByNames(names: string[]): Promise<string> {
  // Get all tax codes and make an array to store ones with matching names.
  const allTaxCodes = JSON.parse(await getTaxCodes());
  const matchingTaxCodes = [];

  // Check if index 0 (the query result value) is a success.
  // If it is not, return the error result instead.
  if (allTaxCodes[0].result !== 'Success') {
    return JSON.stringify(allTaxCodes[0]);
  }

  // Iterate through the remaining indicies to check for matching Tax Codes returned by the getTaxCodes call.
  for (let index = 1; index < allTaxCodes.length; index++) {
    // Check if the name of the current tax code is in the list of passed names.
    if (names.includes(allTaxCodes[index].Name)) {
      matchingTaxCodes.push(allTaxCodes[index]);
    }
  }

  // Return the array of found tax codes with matching names.
  return JSON.stringify(matchingTaxCodes);
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
