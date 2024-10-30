'use server';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import { db } from '@/db/index';
import { Company } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Checks if the current Company is set connected to the synthetic bookkeeper in the database.
// Returns: A string 'true / false' value for the connection state or an error message string.
export async function checkCompanyConnection(): Promise<string> {
  try {
    // Get the current session and use it to get the Company realm Id.
    const session = await getServerSession(options);
    const realmId = session?.realmId;

    // Check the Company realm Id could be found.
    if (realmId) {
      // Check for a Company with the same Company realm Id in the database.
      const currentCompany = await db
        .select()
        .from(Company)
        .where(eq(Company.realmId, realmId));

      // Return the connection status for the Company as a string ('true' or 'false').
      if (currentCompany.length > 0) {
        return String(currentCompany[0].bookkeeperConnected);
      } else {
        // If no Company could be found, the connection is considered false.
        return 'false';
      }
    } else {
      // If realm Id could not be found from the session, the connection is considered false.
      return 'false';
    }
  } catch (error) {
    // Catch any errors and return an error string, include the error message if it is present.
    if (error instanceof Error) {
      return 'Error: ' + error.message;
    } else {
      return 'Error: ' + 'Unidentified Error.';
    }
  }
}
