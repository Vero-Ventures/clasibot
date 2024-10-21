'use server';
import { db } from '@/db/index';
import { Company } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { syntheticLogin } from '@/actions/backend-functions/synthetic-login';
import { classifyCompany } from '@/actions/backend-functions/classification/classify-company';

type databaseUser = {
  id: string;
};

export async function classificationCompanyIteration(user: databaseUser) {
  try {
    // Get all companies assosiated with the user.
    const userCompanies = await db
      .select()
      .from(Company)
      .where(eq(Company.userId, user.id));

    // Iterate through the users connected companies.
    for (const currentCompany of userCompanies) {
      // Check that the company is set to have a valid connection to the synthetic bookkeeper.
      if (currentCompany.bookkeeperConnected) {
        // Get the company Id and potential firm name needed for company selection in synthetic login.
        const companyId = currentCompany.realmId;
        const connectedFirmName = currentCompany.firmName;

        // Call method for synthetic login.
        // Takes: the company realmId and potentially null firm name string.
        // Returns: A QueryResult, the two tokens pulled from the login response headers, and the session.
        const [loginResult, qboToken, authId, session] = await syntheticLogin(
          companyId,
          connectedFirmName
        );

        if (loginResult.result !== 'Error') {
          // Classify the 'For Review' transactions for the currentCompany with the synthetic login values.
          // Use .then() to continue concurrent classification of companies.
          classifyCompany(qboToken, authId, session).then((result) => {
            // Check if the classification failed and log an error it if it did.
            if (result.result === 'Error') {
              // Log the user and company the error occurred on and the message and detail returned by the classification function.
              console.error({
                result:
                  'Error - User: ' +
                  user.id +
                  ', Company: ' +
                  currentCompany.id,
                message: result.message,
                detail: result.detail,
              });
            }
          });
        } else {
          // If the synthetic login failed, log the error Query Result then continue to the next company.
          console.error(loginResult);
        }
      }
    }
  } catch (error) {
    // Catch and log any errors when getting user companies.
    if (error instanceof Error) {
      console.error({
        result: 'Error - User: ' + user.id,
        message:
          'Weekly Classification: Error Fetching User Companies During User-Company Iteration',
        detail: 'Error: ' + error.message,
      });
    } else {
      console.error({
        result: 'Error - User: ' + user.id,
        message:
          'Weekly Classification: Error Fetching User Companies During User-Company Iteration',
        detail: 'Unexpected Error Fetching Companies For User',
      });
    }
  }
}
