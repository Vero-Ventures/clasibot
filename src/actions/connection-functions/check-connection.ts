'use server';

import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

import { db } from '@/db/index';
import { Company } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Returns: A boolean value for the connection state, a result string, and a message string.
export async function checkCompanyConnection(): Promise<{
  connected: boolean;
  result: string;
  message: string;
}> {
  try {
    // Get the current session and use it to get the realm Id.
    const session = await getServerSession(options);
    const realmId = session?.realmId;

    // Check the realm Id could be found.
    if (realmId) {
      // Find the matching Company with the unique realm Id.
      const currentCompany = await db
        .select()
        .from(Company)
        .where(eq(Company.realmId, realmId));

      // Return the connection status of the Company.
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
