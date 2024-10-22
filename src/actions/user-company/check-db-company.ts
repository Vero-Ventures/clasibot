'use server';
import { db } from '@/db/index';
import { Company } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

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

      // Then, return the connection status as 'true' or 'false'.
      if (currentCompany.length > 0) {
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
