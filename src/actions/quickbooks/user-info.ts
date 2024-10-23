'use server';
import { checkFaultProperty } from './query-helpers';
import { getQBObject, getQBObjectWithSession } from '@/actions/qb-client';
import type { LoginTokens } from '@/types/LoginTokens';

// Get the company name from the QuickBooks API.
// May take a session to work with backend functions.
// Returns: The company name as a string or 'Error: Name not found'
export async function getCompanyName(
  loginTokens: LoginTokens | null = null,
  companyId: string | null = null
): Promise<string> {
  try {
    // Define the variable used to make the qbo calls.
    let qbo;

    // Check if a session was passed by a backend function to be used to define the qbo object.
    // Then create the qbo object for frontend or backend functions based on the session presence.
    if (loginTokens && companyId) {
      qbo = await getQBObjectWithSession(loginTokens, companyId);
    } else {
      qbo = await getQBObject();
    }

    // Define a type for the response to allow for type checking.
    type CompanyInfoResponse = {
      QueryResponse: { CompanyInfo: [{ CompanyName: string }] };
    };

    // Search for the company info for the user.
    const response: CompanyInfoResponse = await new Promise((resolve) => {
      qbo.findCompanyInfos((err: Error, data: CompanyInfoResponse) => {
        // If there is an error, check if it has a 'Fault' property
        if (err && checkFaultProperty(err)) {
          // Resolve the function with a response formatted to indicate failure.
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
    // Log the error and return an error string that indicates failure.
    console.error('Error finding company name:', error);
    return 'Error: Name not found';
  }
}

// Get the company industry from the QuickBooks API.
// May take a session to work with backend functions.
// Returns: The company industry as a string or 'Error' / 'None'
export async function getCompanyIndustry(
  loginTokens: LoginTokens | null = null,
  companyId: string | null = null
): Promise<string> {
  try {
    // Define the variable used to make the qbo calls.
    let qbo;

    // Check if a session was passed to be used to define the qbo object.
    // Then define the qbo object based on the session presence.
    if (loginTokens && companyId) {
      qbo = await getQBObjectWithSession(loginTokens, companyId);
    } else {
      qbo = await getQBObject();
    }

    // Define a type for the response to allow for type checking.
    // Name value is an array of data objects that contains amoung its values, a dictionary that contains the industry type.
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

    // Search for the company info for the user.
    const response: CompanyInfoResponse = await new Promise((resolve) => {
      qbo.findCompanyInfos((err: Error, data: CompanyInfoResponse) => {
        // If there is an error, check if it has a 'Fault' property
        if (err && checkFaultProperty(err)) {
          // Resolve the function with a response formatted to indicate failure.
          resolve({
            QueryResponse: {
              CompanyInfo: [{ NameValue: [{ Name: '', Value: '' }] }],
            },
          });
        }
        resolve(data);
      });
    });

    // Get the array of info objects containing the dictionaries that include the industry type.
    const companyNameValueArray =
      response.QueryResponse.CompanyInfo[0].NameValue;

    // Iterate through the dictionaries to look for the one with the industry type.
    for (const item of companyNameValueArray) {
      // If the industry type is found, return it to the caller.
      if (item.Name === 'QBOIndustryType' || item.Name === 'IndustryType') {
        return item.Value;
      }
    }

    // If no match was found for 'QBOIndustryType' or 'IndustryType', return 'None'.
    return 'None';
  } catch (error) {
    // Log the error and return an error string that indicates failure.
    console.error('Error finding industry:', error);
    return 'Error';
  }
}

// Get the company location from the QBO API, return the country and the sub-location for Canadian companies.
// To check for tax classification compatable locations (Canadian), check for a country value of 'CA'.
export async function getCompanyLocation(
  loginTokens: LoginTokens | null = null,
  companyId: string | null = null
): Promise<string> {
  try {
    // Define the variable used to make the qbo calls.
    let qbo;

    // Check if a session was passed to be used to define the qbo object.
    // Then define the qbo object based on the session presence.
    if (loginTokens && companyId) {
      qbo = await getQBObjectWithSession(loginTokens, companyId);
    } else {
      qbo = await getQBObject();
    }

    // Define a type for the response to allow for type checking.
    type CompanyInfoResponse = {
      QueryResponse: {
        CompanyInfo: [
          { CompanyAddr: { Country: string; CountrySubDivisionCode: string } },
        ];
      };
    };

    // Search for the company info for the user.
    const response: CompanyInfoResponse = await new Promise((resolve) => {
      qbo.findCompanyInfos((err: Error, data: CompanyInfoResponse) => {
        // If there is an error, check if it has a 'Fault' property
        if (err && checkFaultProperty(err)) {
          // Resolve the function with a response formatted to indicate failure.
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
    // Example: Either 'CAN' or 'Canada'  NOTE: Presently using CA for Canada so the possible values are unclear.
    const companyCountry =
      response.QueryResponse.CompanyInfo[0].CompanyAddr.Country;

    // Exact list of sub locations is undefined, presently only working with Canadian values anyhow.
    // Currenly assume that sub-locations use standardized 2 letter abbreviations (check taxes enum).
    const companySubLocation =
      response.QueryResponse.CompanyInfo[0].CompanyAddr.CountrySubDivisionCode;

    // Check if the company is Canadian (check value against know possible values for Canada).
    if (
      companyCountry === 'CA' ||
      companyCountry === 'Canada' ||
      companyCountry == 'CAN'
    ) {
      // Return company country and sub-location name.
      return JSON.stringify({ Country: 'CA', SubLocation: companySubLocation });
    } else {
      // If the country is not Canadian, just return the country string.
      return JSON.stringify({
        Country: companyCountry,
        SubLocation: null,
      });
    }
  } catch (error) {
    // Log the error and return an empty string to the caller if the call fails.
    console.error('Error finding company location:', error);
    return JSON.stringify({ Country: '', SubLocation: null });
  }
}
