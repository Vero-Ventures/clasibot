'use server';
import { db } from '@/db/index';
import { Company } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { syntheticLogin } from '@/actions/backend-actions/synthetic-login';
import { classifyCompany } from '@/actions/backend-actions/classification/classify-company';

// Define the type of data passed to the function.
type databaseUser = {
  id: string;
};

// Iterates through a User Companies and starts their Classification process.
// Takes: The Id of the User whose Companies should be Classified.
// Async and concurrent method uses error loggin instead of returning values.
export async function classificationCompanyIteration(user: databaseUser) {
  try {
    // Get all Companies assosiated with the User.
    const userCompanies = await db
      .select()
      .from(Company)
      .where(eq(Company.userId, user.id));

    // Iterate through the User connected database Company objects.
    for (const currentCompany of userCompanies) {
      // Check that the database Company object has a valid connection to the synthetic bookkeeper.
      //    May not be accurate reflection of QuickBooks, but considered to be true if true in the database.
      if (currentCompany.bookkeeperConnected) {
        // Get the Company realm Id and potential Firm name from the Company.
        const companyId = currentCompany.realmId;
        const connectedFirmName = currentCompany.firmName;

        // Call method for synthetic login.
        // Takes: The Company realm Id and possible Firm name used for Company selection.
        // Returns: A QueryResult and a synthetic Login Tokens object.
        const [loginResult, loginTokens] = await syntheticLogin(
          companyId,
          connectedFirmName
        );

        // Check if the synthetic Login resulted in an error.
        if (loginResult.result === 'Error') {
          // If the synthetic login failed, log the error Query Result then continue to the next Company.
          console.error(loginResult);
        } else {
          // Classify the 'For Review' transactions for the current Company.
          // Passes the the synthetic Login Tokens and Company realm Id needed for backend Classificaion.
          classifyCompany(loginTokens, companyId).then((result) => {
            // Use .then() to deal with error logging while the main process continues.
            //    Allows the async Classificaion of Comapnies to be done concurrently.

            // Check if the Classificaion process resulted in an error.
            if (result.result === 'Error') {
              // Log the User and Company the error occurred on.
              console.error({
                result:
                  'Error - User: ' +
                  user.id +
                  ', Company: ' +
                  currentCompany.id,
                // Include the message and detail from the returned Query Result.
                message: result.message,
                detail: result.detail,
              });

              // Update the database Company object.
              // Record that the backend Classificaion process encountered an error and failed.
              db.update(Company)
                .set({ classificationFailed: true })
                .where(eq(Company.id, companyId));
            }
          });
        }
      }
    }
  } catch (error) {
    // Catch any errors and return an error Query Result, include the error message if it is present.
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
