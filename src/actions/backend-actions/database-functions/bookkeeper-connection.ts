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

// Takes the User email and Company name from a QBO company invite.
// Returns: A Query Result object.
// Integration: Called when a regular Company connection invite comes through.
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
      // Find the User Subscription in the database from the User ID.
      const userSubscription = await db
        .select()
        .from(Subscription)
        .where(eq(Subscription.userId, databaseUser[0].id));

      // Get the Subscription status from Stripe by checking for customers with matching ID's.
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
            detail: 'Bookkeeper connection to company set to true.',
          };
        } else {
          // If no matching Companies could be found, return an error message.
          return {
            result: 'Error',
            message: 'Company could not be found.',
            detail:
              'No Companies with that name were found belonging to the user with that email.',
          };
        }
      } else {
        // If the User was found, but had an invalid Subscription, return an error message.
        return {
          result: 'Error',
          message: 'User subscription was invalid.',
          detail:
            'User subscription either did not exist or is not presently active.',
        };
      }
    } else {
      // If no matching Users could be found, return an error message.
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

// Takes the accounting Firm name and User name from a QBO accounting invite.
// Returns: A Query Result object.
// Integration: Called when inital to an accounting Firm invite comes through.
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
        detail: 'An accounting firm with that name and user name was created.',
      };
    } else {
      // If a matching Firm already exists, return an error message.
      return {
        result: 'Error',
        message: 'A Matching Firm Was Already In The Database.',
        detail:
          'A firm with that name and user name already exists in the database.',
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

// Takes a Firm name and an array of Company names from a QBO access update email.
// Returns: A Query Result object.
// Integration: Called when the client access update email for an accounting Firm comes through.
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

                  // Get the Subscription status from Stripe using a list of customers with matching ID's.
                  const subscription = await stripe.subscriptions.list({
                    customer: userSubscription[0].stripeId!,
                  });

                  // Check if the subscription is active and valid.
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
                      message: 'User subscription was invalid.',
                      detail:
                        'A match was found but the users subscription either did not exist or is not presently active.',
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
            'The related user and firm for each company was found and the company was connected.',
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
        message: 'No firms could be found.',
        detail: 'No firms with that name were found.',
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

// Takes a Company realm Id and sets it to inactive in the database.
// Returns: A Query Result object.
// Integration: Called by a frontend button that allows the User to set a Company to be disconnected.
//    Done when a User removes the connection through QuickBooks, required to be done in app as well to avoid issues.
export async function makeCompanyIncactive(
  realmId: string
): Promise<QueryResult> {
  try {
    // Find the Company in the database with the matching ID.
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
        detail: 'Bookkeeper connection to company set to false.',
      };
    } else {
      // If no matching Company could be found, return an error result.
      return {
        result: 'Error',
        message: 'Company could not be found.',
        detail: 'No company with that realm ID could be found.',
      };
    }
  } catch (error) {
    // Catch any errors and return an error response, include the error message if it is present.
    if (error instanceof Error) {
      return {
        result: 'Error',
        message: 'An Unexpected Error Occured The Company Inactive',
        detail: error.message,
      };
    } else {
      return {
        result: 'Error',
        message: 'An Unexpected Error Occured Making The Company Inactive',
        detail: 'N/A',
      };
    }
  }
}
