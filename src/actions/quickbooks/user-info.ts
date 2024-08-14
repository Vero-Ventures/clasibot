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

    // Get the company name from the JSON response and convert it to a string.
    // Check for name existance is not needed, all companies must have a name.
    const companyName = JSON.stringify(
      response.QueryResponse.CompanyInfo[0].CompanyName
    );

    // Return the name value with the surrounding quotation marks removed.
    return companyName.slice(1, -1);
  } catch (error) {
    // Log the error and return an error string to the caller if the call fails.
    console.error('Error finding company name:', error);
    return 'Error: Name not found';
  }
}
