'use server';
import { db } from '@/db/index';
import { Company } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import {
  getCompanyName,
  getCompanyIndustry,
} from '@/actions/quickbooks/user-info';

// Checks if the current company is set as connected to the synthetic account.
// Returns: A string 'true/false' value for the connection state or an error message.
// Integration: Called as part of the login pipeline
export async function checkCompanyConnection(): Promise<string> {
  try {
    // Get the identifing info for the company from the session.
    const session = await getServerSession(options);
    const realmId = session?.realmId;

    // Check the nessasary identifing info could be found.
    if (realmId) {
      // Check for a company with the same realm Id in the database.
      const currentCompany = await db
        .select()
        .from(Company)
        .where(eq(Company.realmId, realmId));

      // If a company was found, run an update on the company info (part of login process).
      // Then, return the connection status as 'true' or 'false'.
      if (currentCompany.length > 0) {
        const result = await updateCompanyInfo(realmId);
        if (result !== 'Success') {
          console.error(result);
        }
        return String(currentCompany[0].bookkeeperConnected);
      } else {
        // If no company is found, the connection is false.
        return 'false';
      }
    } else {
      // If realm ID could not be found from the session, the connection is false.
      return 'false';
    }
  } catch (error) {
    // Catch any errors and return an error with the error message if it is present.
    if (error instanceof Error) {
      return 'Error: ' + error.message;
    } else {
      return 'Error: ' + 'Unidentified Error.';
    }
  }
}

// Takes a companies realm Id, updates the company info in the database and returns a success or error message.
async function updateCompanyInfo(realmId: string): Promise<string> {
  try {
    // Get the current company from the database using the passed realm Id.
    const currentCompany = await db
      .select()
      .from(Company)
      .where(eq(Company.realmId, realmId));

    // Check that a company with the realm Id was found.
    if (currentCompany.length > 0) {
      // Define the company by the first index (unique field check ensure only ever 0 or 1 values are returned).
      const updateCompany = currentCompany[0];

      // Get the company name for the current user and check it was not an error.
      const companyName = await getCompanyName();
      if (companyName !== 'Error: Name not found') {
        // If a non-error name was found, update the company name of the stored company object.
        updateCompany.name = companyName;
      }

      // Get the company industry for the current user and check it was not an error or null.
      const companyIndustry = await getCompanyIndustry();
      if (
        companyIndustry !== 'Error' &&
        companyIndustry !== 'None' &&
        companyIndustry !== ''
      ) {
        // If a non-error industry was found, update the company industry of the stored company object.
        updateCompany.industry = companyIndustry;
      }

      // Update the database with the company object which may have updated values.
      await db
        .update(Company)
        .set(updateCompany)
        .where(eq(Company.realmId, realmId));
    }
    // Return a success message.
    return 'Success';
  } catch (error) {
    // Catch any errors and return an error response with the error message if it is present.
    if (error instanceof Error) {
      return 'Error: ' + error.message;
    } else {
      return 'Error: ' + 'Unidentified Error.';
    }
  }
}
