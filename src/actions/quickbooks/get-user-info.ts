'use server';

import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

import { db } from '@/db/index';
import { Company } from '@/db/schema';
import { eq } from 'drizzle-orm';

import { checkFaultProperty } from '@/actions/helpers/index';

import { getQBObject } from '@/actions/quickbooks/qb-client';

// Get the Company name from the QuickBooks API.
// Returns: The Company name as a string or 'Error: Name not found'
export async function getCompanyName(): Promise<string> {
  try {
    // Define the variable used to make the QBO calls.
    const qbo = await getQBObject();

    // Define a type for the QBO response to allow for type checking.
    type CompanyInfoResponse = {
      QueryResponse: { CompanyInfo: [{ CompanyName: string }] };
    };

    // Search for the User Company Info.
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

    // Get the current session for the Company realm Id.
    const session = await getServerSession(options);

    // Update the company name using the fetched realm Id.
    if (session?.realmId) {
      await db
        .update(Company)
        .set({ name: response.QueryResponse.CompanyInfo[0].CompanyName })
        .where(eq(Company.realmId, session.realmId));
    }

    // Return the name value from the Company Info.
    return response.QueryResponse.CompanyInfo[0].CompanyName;
  } catch (error) {
    // Catch and log any errors, include the error message if it is present.
    console.error('Error finding Company name:', error);
    // On error, return the default error object that indicates failure to find.
    return 'Error: Name not found';
  }
}

// Get the Company industry from the QuickBooks API.
// Returns: The Company industry as a string or 'Error' / 'None'
export async function getCompanyIndustry(): Promise<string> {
  try {
    // Define the variable used to make the QBO calls.
    const qbo = await getQBObject();

    // Define a type for the QBO response to allow for type checking.
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

    // Search for the User Company Info
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

    // Get the array of objects containing the dictionaries that include the industry type.
    const companyNameValueArray =
      response.QueryResponse.CompanyInfo[0].NameValue;

    // Iterate through the values to look for the one containingw the industry type.
    for (const item of companyNameValueArray) {
      // If the industry type is found, return it to the caller.
      if (item.Name === 'QBOIndustryType' || item.Name === 'IndustryType') {
        return item.Value;
      }
    }
    // If no match was found for dictionaries that contain industry type, return 'None'.
    return 'None';
  } catch (error) {
    // Catch and log any errors, include the error message if it is present.
    console.error('Error finding industry:', error);
    // On error, return the default error object that indicates failure to find.
    return 'Error';
  }
}

// Get the Company location from the QBO API, return the country and the Sub-location for Canadian Companies.
// Returns: A stringified object that contains the Country and Sub-location.
export async function getCompanyLocation(): Promise<string> {
  try {
    // Define the variable used to make the QBO calls.
    const qbo = await getQBObject();

    // Define a type for the QBO response to allow for type checking.
    type CompanyInfoResponse = {
      QueryResponse: {
        CompanyInfo: [
          { CompanyAddr: { Country: string; CountrySubDivisionCode: string } },
        ];
      };
    };

    // Search for the User Company Info
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
    // Example: Either 'CAN' or 'Canada'
    //    NOTE: QuickBooks presently uses 'CA' for Canada so the range of possible values are unclear.
    const companyCountry =
      response.QueryResponse.CompanyInfo[0].CompanyAddr.Country;

    // Exact list of Sub-locations is undefined, presently only working with Canadian values.
    // Currenly assume that Sub-locations use standardized 2 letter abbreviations (taxes enum).
    const companySubLocation =
      response.QueryResponse.CompanyInfo[0].CompanyAddr.CountrySubDivisionCode;

    // Check if the Company is Canadian (check value against known possible values for Canada).
    if (
      companyCountry === 'CA' ||
      companyCountry === 'Canada' ||
      companyCountry == 'CAN'
    ) {
      // Return Company Country and Sub-location name.
      return JSON.stringify({ Country: 'CA', SubLocation: companySubLocation });
    } else {
      // If the country is not Canadian, just return the country string.
      return JSON.stringify({
        Country: companyCountry,
        SubLocation: null,
      });
    }
  } catch (error) {
    // Catch and log any errors, include the error message if it is present.
    console.error('Error finding Company location:', error);
    // On error, return the default error object that indicates failure to find.
    return JSON.stringify({ Country: '', SubLocation: null });
  }
}
