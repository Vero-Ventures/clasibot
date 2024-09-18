'use server';
import { createQBObject } from '@/actions/qb-client';
import { checkFaultProperty } from './helpers';

// Find a the company info object and return the industry.
export async function findIndustry(): Promise<string> {
  try {
    // Create the QuickBooks API object.
    const qbo = await createQBObject();

    // Create a type for the response object to allow for type checking.
    // Name value is an array of data objects that contains the industry type.
    type CompanyInfoResponse = {
      QueryResponse: {
        CompanyInfo: [
          {
            NameValue: [
              {
                Name: string;
                Value: string;
              },
            ];
          },
        ];
      };
    };

    // Search for a company info object related to the user.
    const response: CompanyInfoResponse = await new Promise((resolve) => {
      qbo.findCompanyInfos((err: Error, data: CompanyInfoResponse) => {
        // If there is an error, check if it has a 'Fault' property
        if (err && checkFaultProperty(err)) {
          // Then resolve the function with a response with values formatted to indicate failure.
          resolve({
            QueryResponse: {
              CompanyInfo: [{ NameValue: [{ Name: '', Value: '' }] }],
            },
          });
        }
        resolve(data);
      });
    });

    // Get the array of info objects containing the industry type data from the company info.
    const companyNameValueArray =
      response.QueryResponse.CompanyInfo[0].NameValue;

    for (const item of companyNameValueArray) {
      // If the industry type is found, return it to the caller.
      if (item.Name === 'QBOIndustryType' || item.Name === 'IndustryType') {
        return item.Value;
      }
    }

    // If no match was found for 'QBOIndustryType' or 'IndustryType', return 'None'.
    return 'None';
  } catch (error) {
    // Log the error and return the industry type as 'Error'.
    console.error('Error finding industry:', error);
    return 'Error';
  }
}

// Get the company name from the QuickBooks API.
export async function getCompanyName(): Promise<string> {
  try {
    // Create the QuickBooks API object.
    const qbo = await createQBObject();

    // Create a type for the response object to allow for type checking.
    type CompanyInfoResponse = {
      QueryResponse: { CompanyInfo: [{ CompanyName: string }] };
    };

    // Search for a company info object related to the user.
    const response: CompanyInfoResponse = await new Promise((resolve) => {
      qbo.findCompanyInfos((err: Error, data: CompanyInfoResponse) => {
        // If there is an error, check if it has a 'Fault' property
        if (err && checkFaultProperty(err)) {
          // Then resolve the function with a response with values formatted to indicate failure.
          resolve({
            QueryResponse: {
              CompanyInfo: [{ CompanyName: 'Error: Name not found' }],
            },
          });
        }
        resolve(data);
      });
    });

    // Return the name value from the company info.
    return response.QueryResponse.CompanyInfo[0].CompanyName;
  } catch (error) {
    // Log the error and return an error string to the caller if the call fails.
    console.error('Error finding company name:', error);
    return 'Error: Name not found';
  }
}

// Get the company location from the QBO API, return the country and the sub-location for Canadian companies.
// To check for tax classification compatable locations, check for a country value of 'CA'.
export async function getCompanyLocation(): Promise<string> {
  try {
    // Create the QuickBooks API object.
    const qbo = await createQBObject();

    // Create a type for the response object to allow for type checking.
    type CompanyInfoResponse = {
      QueryResponse: {
        CompanyInfo: [
          { CompanyAddr: { Country: string; CountrySubDivisionCode: string } },
        ];
      };
    };

    // Search for a company info object related to the user.
    const response: CompanyInfoResponse = await new Promise((resolve) => {
      qbo.findCompanyInfos((err: Error, data: CompanyInfoResponse) => {
        // If there is an error, check if it has a 'Fault' property
        if (err && checkFaultProperty(err)) {
          // Then resolve the function with a response with values formatted to indicate failure.
          resolve({
            QueryResponse: {
              CompanyInfo: [
                { CompanyAddr: { Country: '', CountrySubDivisionCode: '' } },
              ],
            },
          });
        }
        resolve(data);
      });
    });

    // Countries should be defined by either a 3 letter '3166-1 alpha-3' code or by the full name.
    // Example: Either 'CAN' or 'Canada'
    // NOTE: Presently it is defined as CA for Canada so exact range of possible values is unclear.
    const companyCountry =
      response.QueryResponse.CompanyInfo[0].CompanyAddr.Country;
    // Exact list of sub divisions is unclear as it lacks definition in the documentation,
    // Currenly assume that canada subdivisions match standardized 2 letter abbreviations used in the taxes enum.
    const companySubLocation =
      response.QueryResponse.CompanyInfo[0].CompanyAddr.CountrySubDivisionCode;

    // Check if the company is Canadian
    if (
      companyCountry === 'CA' ||
      companyCountry === 'Canada' ||
      companyCountry == 'CAN'
    ) {
      // Return company location with standardized country name.
      return JSON.stringify({ Country: 'CA', Location: companySubLocation });
    } else {
      return JSON.stringify({
        Country: companyCountry,
        Location: companySubLocation,
      });
    }
  } catch (error) {
    // Log the error and return an empty string to the caller if the call fails.
    console.error('Error finding company location:', error);
    return JSON.stringify({ Country: '', Location: '' });
  }
}
