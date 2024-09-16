'use server';
import { createQBObject } from '../qb-client';
import { checkFaultProperty, createQueryResult } from './helpers';
import type { TaxCode } from '@/types/TaxCode';
import type { TaxRate } from '@/types/TaxRate';
import type { ErrorResponse } from '@/types/ErrorResponse';

// Gets tax codes and returns them as an array of tax code objects.
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
    const response: TaxCodeResponse = await new Promise((resolve, reject) => {
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
      taxCodes.push(formatTaxCode(taxCode));
    }

    // Return the array of formatted tax codes.
    return JSON.stringify(taxCodes);
  } catch (error) {
    return JSON.stringify(error);
  }
}

// Get a specific tax code using its ID.
export async function findTaxCode(id: string): Promise<string> {
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

    // Get all tax code objects.
    const response: TaxCode = await new Promise((resolve, reject) => {
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

export async function getTaxRates(): Promise<string> {}

export async function findTaxRate(id: string): Promise<string> {}
