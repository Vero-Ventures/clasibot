'use server';

import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

import { db } from '@/db/index';
import { Company } from '@/db/schema';
import { eq } from 'drizzle-orm';

import { checkFaultProperty } from '@/actions/helpers/index';

import { getQBObject } from '@/actions/quickbooks/qb-client';

// Returns: The Company Name as a string, On Error: 'Error: Name not found'
export async function getCompanyName(): Promise<string> {
  try {
    // Define the variable used to make the QBO calls.
    const qbo = await getQBObject();

    // Define a type for the QBO response to allow for type checking.
    type CompanyInfoResponse = {
      QueryResponse: { CompanyInfo: [{ CompanyName: string }] };
    };

    // Search for the Company Info.
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

    // Get the current session for the realm Id.
    const session = await getServerSession(options);

    // Update the Company name using the unqiue realm Id from the session.
    if (session?.realmId) {
      await db
        .update(Company)
        .set({ name: response.QueryResponse.CompanyInfo[0].CompanyName })
        .where(eq(Company.realmId, session.realmId));
    }

    // Return the Name value from the Company Info.
    return response.QueryResponse.CompanyInfo[0].CompanyName;
  } catch (error) {
    // Catch and log any errors, include the error message if it is present.
    console.error('Error Finding Company Name:', error);
    // On error, return the default error object that indicates failure to find.
    return 'Error: Name not found';
  }
}

// Returns: The Company Industry as a string, On Error / Null: 'Error' / 'None'
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

    // Get the array of objects containing the Industry type.
    const companyNameValueArray =
      response.QueryResponse.CompanyInfo[0].NameValue;

    // Iterate through the values to look for the one containing the Industry type.
    for (const item of companyNameValueArray) {
      // If the Industry type is found, return it to the caller.
      if (item.Name === 'QBOIndustryType' || item.Name === 'IndustryType') {
        return item.Value;
      }
    }
    // If no match was found for the Industry type, return 'None'.
    return 'None';
  } catch (error) {
    // Catch and log any errors, include the error message if it is present.
    console.error('Error Finding Industry:', error);
    // On error, return the default error object that indicates failure to find.
    return 'Error';
  }
}

// Returns: A stringified object that contains the Country and Sub-Location.
//          On Error: { Country: '', SubLocation: null }
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

    // Countries should be defined by either a 3 letter '3166-1 alpha-3' code or by the full name. ('CAN' or 'Canada')
    // Note: QuickBooks presently uses 'CA' for Canada so range of possible values is unclear.
    const companyCountry =
      response.QueryResponse.CompanyInfo[0].CompanyAddr.Country;

    // Get Company Sub-Location, assume that it uses standardized 2 letter abbreviations (Taxes Enum).
    const companySubLocation =
      response.QueryResponse.CompanyInfo[0].CompanyAddr.CountrySubDivisionCode;

    // Check if the Company Country is contained in the list of possible Canadian values.
    if (
      companyCountry === 'CA' ||
      companyCountry === 'Canada' ||
      companyCountry == 'CAN'
    ) {
      // Return Company Country and Sub-Location name.
      return JSON.stringify({ Country: 'CA', SubLocation: companySubLocation });
    } else {
      // If the Country is not Canadian, just return the Country string.
      return JSON.stringify({
        Country: companyCountry,
        SubLocation: null,
      });
    }
  } catch (error) {
    // Catch and log any errors, include the error message if it is present.
    console.error('Error Finding Company Location:', error);
    // On error, return the default error object that indicates failure to find.
    return JSON.stringify({ Country: '', SubLocation: null });
  }
}
