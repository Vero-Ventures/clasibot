'use server';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import { db } from '@/db/index';
import { Company } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { syntheticLogin } from '@/actions/backend-actions/synthetic-login';
import { classifyCompany } from './classify-company';

// Runs backend Classification on the 'For Review' transactions for the current Company.
// Takes: A callback function to update the state on frontend.
// Returns: A boolean indicating if Classification was successful.
export async function manualClassify(
  setFrontendState: (newState: string) => void
): Promise<boolean> {
  try {
    // Get the current session for the Company realm Id of the currently logged in Company.
    const session = await getServerSession(options);

    // If session or Company realm Id are not found, handle error logging, state update, and return a failure value.
    if (!session?.realmId) {
      console.error('Backend Classification: Session Not Found.');
      setFrontendState('An Unexpected Error Occured');
      return false;
    }

    // Get the current Company from the database to check for a Firm name.
    // Used in synthetic login for Companies accessed through an accounting Firm.
    const currentCompany = await db
      .select()
      .from(Company)
      .where(eq(Company.realmId, session.realmId));

    // Check that a matching database Company object was found.
    // Handle error logging, state update, and failure return if no matching Company is found.
    if (!currentCompany[0]) {
      console.error('Backend Classification: Company Not Found In Database.');
      setFrontendState('An Unexpected Error Occured');
      return false;
    }

    // Call synthetic login method with the Company realm Id and (possibly null) Firm name for the Company.
    // Returns: A QueryResult and a synthetic Login Tokens object.
    const [loginResult, loginTokens] = await syntheticLogin(
      session.realmId,
      currentCompany[0].firmName
    );

    // Check the synthetic login call resulted in error.
    if (loginResult.result === 'Error ') {
      // If the synthetic login resulted in error, Log the Query Result, update frontend state, and return a failure boolean.
      console.error(loginResult);
      setFrontendState('An Unexpected Error Occured');
      return false;
    } else {
      // If synthetic login was success, call the Company Classification handler.
      // Pass the synthetic Login Tokens, Company realm Id, manual Classification boolean, and frontend state handler
      const result = await classifyCompany(
        loginTokens,
        session.realmId,
        true,
        setFrontendState
      );

      // Check if the Company Classification call resulted in error, then update the frontend state and return a success boolean.
      if (result.result === 'Error') {
        // On error also log an error message before returning.
        console.error(
          'Unexpected Error In Manual Classification :' + result.message
        );
        setFrontendState('An Unexpected Error Occured');
        return false;
      } else {
        setFrontendState('Classifications Saved.');
        return true;
      }
    }
  } catch (error) {
    // Catch any errors and log an error, include the error message if it is present.
    if (error instanceof Error) {
      console.log('Error During Manual Classification : ' + error.message);
    } else {
      console.log('Unexpected Error During Manual Classification');
    }
    // Update the frontend state and return a failure boolean.
    setFrontendState('An Unexpected Error Occured');
    return false;
  }
}
