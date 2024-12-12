'use server';

import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

import { db } from '@/db/index';
import { Company } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Checks if the current Company is set as connected to the Synthetic Bookkeeper.
// Returns: A string 'true / false' value for the connection state or an error message string.
export async function checkCompanyConnection(): Promise<{
  connected: boolean;
  result: string;
  message: string;
}> {
  try {
    // Get the current session and use it to get the Company realm Id.
    const session = await getServerSession(options);
    const realmId = session?.realmId;

    // Check the Company realm Id could be found.
    if (realmId) {
      // Check for a Company with the same Company realm Id.
      const currentCompany = await db
        .select()
        .from(Company)
        .where(eq(Company.realmId, realmId));

      // Return the connection status for the Company as a string ('true' or 'false').
      if (currentCompany.length > 0) {
        return {
          connected: currentCompany[0].bookkeeperConnected,
          result: 'Success',
          message: 'Checked Successfully',
        };
      } else {
        // If no Company could be found, the connection is considered false.
        return {
          connected: false,
          result: 'Error',
          message: 'No Company Found',
        };
      }
    } else {
      // If realm Id could not be found from the session, the connection is considered false.
      return {
        connected: false,
        result: 'Error',
        message: 'No Realm Id Found In Session',
      };
    }
  } catch (error) {
    // Catch any errors and return an error string, include the error message if it is present.
    if (error instanceof Error) {
      return {
        connected: false,
        result: 'Error',
        message: 'Error: ' + error.message,
      };
    } else {
      return {
        connected: false,
        result: 'Error',
        message: 'Unexpected Error',
      };
    }
  }
}
