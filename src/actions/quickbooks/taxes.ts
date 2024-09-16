'use server';
import { createQBObject } from '../qb-client';
import { checkFaultProperty, createQueryResult } from './helpers';
import type { TaxCode } from '@/types/TaxCode';
import type { TaxRate } from '@/types/TaxRate';
import type { ErrorResponse } from '@/types/ErrorResponse';

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
  // Define the names of the currently valid tax codes and return if it includes the passed name.
  const validTaxCodeNames = [
    'Exempt',
    'Zero-rated',
    'Out of Scope',
    'GST',
    'GST/PST BC',
    'PST BC',
    'GST/PST MB',
    'PST MB',
    'GST/PST SK',
    'PST SK',
    'GST/QST QC - 9.975',
    'QST QC - 9.975',
    'HST NS',
    'HST ON',
    'HST NB 2016',
    'HST NL 2016',
    'HST PE 2016',
  ];
  return validTaxCodeNames.includes(taxCodeName);
}

// Get all the tax rates and returns them as an array of tax rate objects.
export async function getTaxRates(): Promise<string> {
  try {
    // Create the QuickBooks API object.
    const qbo = await createQBObject();

    // Define format of returned group of tax rate objects.
    type TaxCodeResponse = {
      QueryResponse: { TaxCode: TaxRate[] };
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

    // Get all tax rate objects.
    const response: any = await new Promise((resolve) => {
      qbo.findTaxRates((err: ErrorResponse, data: any) => {
        if (err && checkFaultProperty(err)) {
          success = false;
          error = err;
        }
        resolve(data);
      });
    });

    // Create an array to store the tax rates.
    const taxRates = [];

    // Create a query result and push it to the tax rates array.
    const queryResult = createQueryResult(success, error);
    taxRates.push(queryResult);

    // Iterate through the response to format and add the individal tax rates to the array.
    for (const taxRate of response.QueryResponse.TaxRate) {
      // Push active tax rates that contain a valid rate value to the array.
      // Also check if the tax rate is in the list of current tax rates before pushing.
      if (
        taxRate.RateValue !== undefined &&
        taxRate.Active === true &&
        checkForCurrentTaxRate(taxRate.Name)
      ) {
        taxRates.push(taxRate);
      }
    }

    // Return the array of formatted tax rates.
    return JSON.stringify(taxRates);
  } catch (error) {
    return JSON.stringify(error);
  }
}

// Get a specific tax rate using its ID.
export async function findTaxRate(id: string): Promise<string> {
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

    // Get all a tax rate by its ID.
    const response: TaxRate = await new Promise((resolve) => {
      qbo.getTaxRate(id, (err: ErrorResponse, data: TaxRate) => {
        if (err && checkFaultProperty(err)) {
          success = false;
          error = err;
        }
        resolve(data);
      });
    });

    // Create an array to store the tax codes.
    const taxRateResult = [];

    // Create a query result and push it to the result array.
    const queryResult = createQueryResult(success, error);
    taxRateResult.push(queryResult);

    // Format the response and push it to the result array.
    taxRateResult.push(formatTaxRate(response));

    // Return the array of formatted tax rates.
    return JSON.stringify(taxRateResult);
  } catch (error) {
    return JSON.stringify(error);
  }
}

// Take a tax rate response from the API and format it by grabbing the relevant values from the whole response.
function formatTaxRate(taxRateResponse: TaxRate): TaxRate {
  // Create object with relevant elements from passed raw API tax rate object.
  const formattedTaxRate: TaxRate = {
    Id: taxRateResponse.Id,
    Name: taxRateResponse.Name,
    Description: taxRateResponse.Description,
    Active: taxRateResponse.Active,
    RateValue: taxRateResponse.RateValue,
    DisplayType: taxRateResponse.DisplayType,
  };

  // Return the formatted object just containing the relevant data.
  return formattedTaxRate;
}

// Take a tax code name and check if it currently valid for use.
function checkForCurrentTaxRate(taxCodeName: string): boolean {
  // Define the names of the currently valid tax codes and return if it includes the passed name.
  const validTaxCodeNames = [
    'GST EP',
    'GST/HST (ITC) ZR',
    'NOTAXP',
    'GST (ITC)',
    'PST (BC) Purchase',
    'PST (MB) on purchase',
    'PST (SK) 2017 on purchases',
    'QST 9.975 (ITR)',
    'HST (ITC) NS',
    'HST (ITC) ON',
    'HST (ITC) NB 2016',
    'HST (NL) 2016',
    'HST (PE) 2016',
  ];
  return validTaxCodeNames.includes(taxCodeName);
}
