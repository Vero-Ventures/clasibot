'use server';
import { db } from '@/db/index';
import { Company, User, Firm, Subscription } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { QueryResult } from '@/types/QueryResult';
import { Stripe } from 'stripe';

// Create a new Stripe object with the private key.
// Used to check the User Subscription before updating database.
const stripe = new Stripe(
  process.env.APP_CONFIG === 'production'
    ? (process.env.PROD_STRIPE_PRIVATE_KEY ?? '')
    : (process.env.DEV_STRIPE_PRIVATE_KEY ?? '')
);

// Takes info from a QuickBooks Company invite email and updates the related database Company object.
// Takes: The User email and Company name from a QBO Company invite.
// Returns: A Query Result object for finding and updating the Comapany in the database.
export async function addCompanyConnection(
  userEmail: string,
  companyName: string
): Promise<QueryResult> {
  try {
    // Use the passed User email to find the related User from the database.
    const databaseUser = await db
      .select()
      .from(User)
      .where(eq(User.email, userEmail));

    // Check that a related database User object was found.
    if (databaseUser) {
      // Find the User Subscription in the database from the User Id.
      const userSubscription = await db
        .select()
        .from(Subscription)
        .where(eq(Subscription.userId, databaseUser[0].id));

      // Get the Subscription status from Stripe by checking for Customers with matching Id.
      const subscription = await stripe.subscriptions.list({
        customer: userSubscription[0].stripeId!,
      });

      // Check the Subscription is active and valid.
      const subStatus = subscription.data[0]?.status;

      // Continue if a valid Subscription is found.
      if (subStatus) {
        // Check for Companies in the database related to the found User and have the passed Company name.
        const databaseCompanies = await db
          .select()
          .from(Company)
          .where(
            eq(Company.userId, databaseUser[0].id) &&
              eq(Company.name, companyName)
          );

        if (databaseCompanies) {
          // Update all the User Companies in the database with that name and return a success message.
          for (const company of databaseCompanies) {
            await db
              .update(Company)
              .set({ bookkeeperConnected: true })
              .where(eq(Company.id, company.id));
          }
          return {
            result: 'Success',
            message: 'Bookkeeper connected.',
            detail: 'Bookkeeper connection to Company set to true.',
          };
        } else {
          // If no matching Companies could be found, return an error message.
          return {
            result: 'Error',
            message: 'Company could not be found.',
            detail:
              'No Companies with that name were found belonging to the User with that email.',
          };
        }
      } else {
        // If the User was found, but had an invalid Subscription, return an error message.
        return {
          result: 'Error',
          message: 'User Subscription was invalid.',
          detail:
            'User Subscription either did not exist or is not presently active.',
        };
      }
    } else {
      // If no matching User could be found, return an error message.
      return {
        result: 'Error',
        message: 'User could not be found.',
        detail: 'No Users in the database with that email could be found.',
      };
    }
  } catch (error) {
    // Catch any errors and return a response, include the error message if it is present.
    if (error instanceof Error) {
      return {
        result: 'Error',
        message: 'An Unexpected Error Occured Adding Company Connection',
        detail: error.message,
      };
    } else {
      return {
        result: 'Error',
        message: 'An Unexpected Error Occured Adding Company Connection',
        detail: 'N/A',
      };
    }
  }
}

// Takes info from a QuickBooks accounting Firm invite email and creates a related database Firm object.
// Takes: The accounting Firm name and User name from a QBO Firm invite.
// Returns: A Query Result object for adding the Firm to database.
export async function addAccountingFirmConnection(
  connectedFirmName: string,
  userName: string
): Promise<QueryResult> {
  try {
    // Get all Firms matching the passed Firm name and User name.
    const existingFirm = await db
      .select()
      .from(Firm)
      .where(eq(Firm.name, connectedFirmName) && eq(Firm.userName, userName));

    // Check if an existing Firm with that name exists.
    if (!existingFirm) {
      // If no existing Firm exists, create it and return a success response.
      await db
        .insert(Firm)
        .values({ name: connectedFirmName, userName: userName });
      return {
        result: 'Success',
        message: 'Firm Created.',
        detail: 'An accounting Firm with that name and User name was created.',
      };
    } else {
      // If a matching Firm already exists, return an error message.
      return {
        result: 'Error',
        message: 'A Matching Firm Was Already In The Database.',
        detail:
          'A Firm with that name and User name already exists in the database.',
      };
    }
  } catch (error) {
    // Catch any errors and return an error response, include the error message if it is present.
    if (error instanceof Error) {
      return {
        result: 'Error',
        message: 'An Unexpected Error Occured Adding The Firm Connection',
        detail: error.message,
      };
    } else {
      return {
        result: 'Error',
        message: 'An Unexpected Error Occured Adding The Firm Connection',
        detail: 'N/A',
      };
    }
  }
}

// Takes info from a QuickBooks Firm client access email and updates the related database Company objects.
// Takes: A Firm name and an array of Company names from a QBO client access update email.
// Returns: A Query Result object.
export async function addAccountingFirmCompanies(
  connectedFirmName: string,
  companyNames: string[]
): Promise<QueryResult> {
  try {
    // Create a variable to track the overall update success and array to track failed to connect Company names.
    let success = true;
    const failedCompanies = [];

    // Check for an accounting Firm with the passed name.
    const possibleFirms = await db
      .select()
      .from(Firm)
      .where(eq(Firm.name, connectedFirmName));

    // Create a variable to shortcut updates after a matching Firm is found.
    let matchingUser;

    // Check if any possible Firms were found.
    if (possibleFirms) {
      // Iterate through the Company names passed from the email.
      for (const companyName of companyNames) {
        // Get all Companies with a matching name.
        const matchingCompanies = await db
          .select()
          .from(Company)
          .where(eq(Company.name, companyName));

        // Iterate through matching Companies, if any are found.
        if (matchingCompanies) {
          for (const potentialCompany of matchingCompanies) {
            // If the matching User has already been found, update the Company.
            if (matchingUser) {
              // Update the Company connection status and set an assosiated Firm name.
              await db
                .update(Company)
                .set({
                  bookkeeperConnected: true,
                  firmName: connectedFirmName,
                })
                .where(eq(Company.id, potentialCompany.id));
              // Skip to the next Company.
              break;
            }

            // Get the database User connected to the Company.
            const user = await db
              .select()
              .from(User)
              .where(eq(User.id, potentialCompany.userId));

            // Check if a matching User was found.
            if (user[0]) {
              // Check through the list of found Firms for one with the same full name as the User.
              for (const firm of possibleFirms) {
                if (user[0].userName === firm.userName) {
                  // If a match is found, define that User for that Firm by their database Id.
                  await db
                    .update(Firm)
                    .set({ userId: user[0].id })
                    .where(eq(Firm.id, firm.id));

                  // Find the User Subscription in the database by the database User object Id.
                  const userSubscription = await db
                    .select()
                    .from(Subscription)
                    .where(eq(Subscription.userId, user[0].id));

                  // Get the Subscription status from Stripe using a list of Customers with matching Id.
                  const subscription = await stripe.subscriptions.list({
                    customer: userSubscription[0].stripeId!,
                  });

                  // Check if the Subscription is active and valid.
                  const subStatus = subscription.data[0]?.status;
                  if (subStatus) {
                    // If the matching Users Subscription is valid, record the related User for later shortcutting.
                    matchingUser = User.id;

                    // Update the Company connection status and related Firm name.
                    await db
                      .update(Company)
                      .set({
                        bookkeeperConnected: true,
                        firmName: connectedFirmName,
                      })
                      .where(eq(Company.id, potentialCompany.id));

                    // Continue to the next Company.
                    break;
                  } else {
                    // If a matching User is found, but the Subscription is invalid, return an error to indicate success with an invalid Subscription.
                    return {
                      result: 'Error',
                      message: 'User Subscription was invalid.',
                      detail:
                        'A match was found but the User Subscription either did not exist or is not presently active.',
                    };
                  }
                }
              }
              // If no potential related Firms are found, set success to false and push the Company name to the list of failed connections.
              success = false;
              failedCompanies.push(potentialCompany.name);
            } else {
              // If no potential related Users are found, set success to false and push the Company name to the list of failed connections.
              success = false;
              failedCompanies.push(potentialCompany.name);
            }
            // If no matches were found for the Company name, set success to false and push the Company name to the list of failed connections.
            success = false;
            failedCompanies.push(potentialCompany.name);
          }
        } else {
          // If no matching Companies were found, set success to false and push the current Company name to the list of failed connections.
          success = false;
          failedCompanies.push(companyName);
        }
      }
      // After checking all Companies, either return a Query Result.
      if (success) {
        return {
          result: 'Success',
          message: 'All companies matched and activated.',
          detail:
            'The related User and Firm for each Company was found and the Company was connected.',
        };
      } else {
        // On failure, return a stringified version of the array of failed connection Companies.
        return {
          result: 'Error',
          message: 'One or more companies could not be found.',
          detail: JSON.stringify(failedCompanies),
        };
      }
    } else {
      // If no Firms with a matching name were found, return an error.
      return {
        result: 'Error',
        message: 'No Firms could be found.',
        detail: 'No Firms with that name were found.',
      };
    }
  } catch (error) {
    // Catch any errors and return an error response, include the error message if it is present.
    if (error instanceof Error) {
      return {
        result: 'Error',
        message:
          'An Unexpected Error Occured Connecting Companies To Accounting Firm',
        detail: error.message,
      };
    } else {
      return {
        result: 'Error',
        message:
          'An Unexpected Error Occured Connecting Companies To Accounting Firm',
        detail: 'N/A',
      };
    }
  }
}

// Updates a database Company object to be set as disconnected from the synthetic bookkeeper.
//    Done to prevent us from continuing to access that Company.
// Takes: A Company realm Id.
// Returns: A Query Result object.
export async function makeCompanyIncactive(
  realmId: string
): Promise<QueryResult> {
  try {
    // Find the Company in the database with the matching Id.
    const company = await db
      .select()
      .from(Company)
      .where(eq(Company.realmId, realmId));

    // If a Company is found, set its connection status to false.
    if (company[0]) {
      await db
        .update(Company)
        .set({ bookkeeperConnected: false })
        .where(eq(Company.id, company[0].id));

      // After updating the connection, return a success result.
      return {
        result: 'Success',
        message: 'Bookkeeper connection deactivated.',
        detail: 'Bookkeeper connection to Company set to false.',
      };
    } else {
      // If no matching Company could be found, return an error result.
      return {
        result: 'Error',
        message: 'Company could not be found.',
        detail: 'No Company with that realm Id could be found.',
      };
    }
  } catch (error) {
    // Catch any errors and return an error response, include the error message if it is present.
    if (error instanceof Error) {
      return {
        result: 'Error',
        message:
          'An Unexpected Error Occured While Making The Company Inactive',
        detail: error.message,
      };
    } else {
      return {
        result: 'Error',
        message:
          'An Unexpected Error Occured While Making The Company Inactive',
        detail: 'N/A',
      };
    }
  }
}
