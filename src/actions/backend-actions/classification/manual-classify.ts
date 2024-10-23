'use server';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import { db } from '@/db/index';
import { Company } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { syntheticLogin } from '@/actions/backend-actions/synthetic-login';
import { classifyCompany } from './classify-company';

// Takes a function to update state on front end.
// Returns: A boolean indicating if manual classification was successful.
// Integration: Requires synthetic login and state handling on frontend.
export async function manualClassify(
  setManualClassificationState: (newState: string) => void
): Promise<boolean> {
  try {
    // Get the current session to get the company realm Id.
    const session = await getServerSession(options);

    // Handle error logging, state update, and failure return if session is not found.
    if (!session?.realmId) {
      console.error('Backend Classification: Session Not Found.');
      setManualClassificationState('An Unexpected Error Occured');
      return false;
    }

    // Get the current company from the database to check for a potential firm name.
    // Needed during synthetic login if access to company comes through an accounting firm.
    const currentCompany = await db
      .select()
      .from(Company)
      .where(eq(Company.realmId, session.realmId));

    // Check that a matching company was found.
    // Handle error logging, state update, and failure return if no matching company is found.
    if (!currentCompany[0]) {
      console.error('Backend Classification: Company Not Found In Database.');
      setManualClassificationState('An Unexpected Error Occured');
      return false;
    }

    // Call method for synthetic login.
    // Takes: the company realmId and potentially null firm name string.
    // Returns: A QueryResult, the two tokens pulled from the login response headers, and the session.
    const [loginResult, loginTokens] = await syntheticLogin(
      session.realmId,
      currentCompany[0].firmName
    );

    // Check the synthetic login response to prevent any errors.
    if (loginResult.result !== 'Error ') {
      // Make a call to the company classification method with the retrived values and company Id.
      const result = await classifyCompany(
        loginTokens,
        session.realmId,
        true,
        setManualClassificationState
      );

      // Depending on the result of the classification call, update the manual classification state and return a success boolean value.
      if (result.result === 'Success') {
        setManualClassificationState('Classifications Saved.');
        return true;
      } else {
        // Log the error from company classification as well as updating frontend state and reutning failure boolean value.
        console.error('Unexpected Error, Message:' + result.message);
        setManualClassificationState('An Unexpected Error Occured');
        return false;
      }
    } else {
      // Log the Query Result from the failed synthetic login, update frontend to failure state, then return a failure boolean value.
      console.error(loginResult);
      setManualClassificationState('An Unexpected Error Occured');
      return false;
    }
  } catch (error) {
    // Catch any errors and log an error with the error message if it is present.
    if (error instanceof Error) {
      console.log('Error During Manual Classification : ' + error.message);
    } else {
      console.log('Unexpected Error During Manual Classification');
    }
    // Update the frontend state and return a failure boolean value.
    setManualClassificationState('An Unexpected Error Occured');
    return false;
  }
}
