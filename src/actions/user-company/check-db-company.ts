'use server';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import { db } from '@/db/index';
import { Company } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Checks if the current company is set connected to the synthetic accountant in the database.
// Returns: A string 'true/false' value for the connection state or an error message.
// Integration: Called as part of the login pipeline
export async function checkCompanyConnection(): Promise<string> {
  try {
    // Get the current session and use it to get the realm Id.
    const session = await getServerSession(options);
    const realmId = session?.realmId;

    // Check the realm Id could be found.
    if (realmId) {
      // Check for a company with the same realm Id in the database.
      const currentCompany = await db
        .select()
        .from(Company)
        .where(eq(Company.realmId, realmId));

      // Return the connection status for the company as a string ('true' or 'false').
      if (currentCompany.length > 0) {
        return String(currentCompany[0].bookkeeperConnected);
      } else {
        // If no company could be found, the connection is considered false.
        return 'false';
      }
    } else {
      // If realm ID could not be found from the session, the connection is considered false.
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
