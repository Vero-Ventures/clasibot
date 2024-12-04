'use server';

import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

import { db } from '@/db/index';
import { Company, User, Firm, Subscription } from '@/db/schema';
import { eq } from 'drizzle-orm';

import { Stripe } from 'stripe';

import type { QueryResult } from '@/types/index';

// Create a new Stripe object with the private key.
// Used to check the User Subscription before updating database.
const stripe = new Stripe(
  process.env.APP_CONFIG === 'production'
    ? (process.env.PROD_STRIPE_PRIVATE_KEY ?? '')
    : (process.env.DEV_STRIPE_PRIVATE_KEY ?? '')
);

// Takes info from a QuickBooks Company invite Email and updates the related database Company object.
// Takes: The User and Company name from a QBO Company invite.
// Returns: A Query Result object for finding and updating the Comapany in the database.
export async function addCompanyConnection(
  userName: string,
  companyName: string
): Promise<QueryResult> {
  try {
    // Use the passed User Email to find the related User from the database.
    const databaseUsers = await db
      .select()
      .from(User)
      .where(eq(User.userName, userName));

    // Iterate through the database Users to check their Subscription status and Companies.
    for (const user of databaseUsers) {
      // Find the User Subscription in the database from the User Id.
      const userSubscription = await db
        .select()
        .from(Subscription)
        .where(eq(Subscription.userId, user.id));

      // Get the Subscription status from Stripe by checking for Customers with matching Id.
      const subscription = await stripe.subscriptions.list({
        customer: userSubscription[0].stripeId!,
      });

      // Check the Subscription is active and valid.
      const subStatus = subscription.data[0]?.status;

      // Continue if a valid Subscription is found.
      if (subStatus) {
        // Get all the Companies assosiated with the user.
        const userCompanies = await db
          .select()
          .from(Company)
          .where(eq(Company.userId, user.id));

        // Iterate through the user Companies for the assosiated one.
        for (const company of userCompanies) {
          // Check if the Company name matches the passed name.
          if (company.name === companyName) {
            // If a match is found, update the company and return a success Query Result.
            await db
              .update(Company)
              .set({ bookkeeperConnected: true })
              .where(eq(Company.id, company.id))
              .returning();

            return {
              result: 'Success',
              message: 'Bookkeeper connected.',
              detail: 'Bookkeeper connection to Company set to true.',
            };
          }
        }
      }
    }

    // If no matching User could be found, return an error message.
    return {
      result: 'Error',
      message: 'User or Company could not be found.',
      detail:
        'No valid Users in the database with that name were connected to a Company with that name.',
    };
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

// Takes info from a QuickBooks accounting Firm invite Email and creates a related database Firm object.
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
    if (!existingFirm[0]) {
      // If no existing Firm exists, create it and return a success response.
      await db
        .insert(Firm)
        .values({ name: connectedFirmName, userName: userName })
        .returning();

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

// Takes info from a QuickBooks Firm client access Email and updates the related database Company objects.
// Takes: A Firm name and an array of Company names from a QBO client access update Email.
// Returns: A Query Result object.
export async function changeAccountingFirmCompanyAccess(
  connectedFirmName: string,
  companyNames: string[],
  addConnection: boolean
): Promise<QueryResult> {
  try {
    console.log('Add Clients');
    console.log(addCompanyConnection);

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
      // Iterate through the Company names passed from the Email.
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
              const shortcutUpdateCompany = await db
                .update(Company)
                .set({
                  bookkeeperConnected: addConnection,
                  firmName: connectedFirmName,
                })
                .where(eq(Company.id, potentialCompany.id))
                .returning();

              console.log('Shortcut Update Company');
              console.log(shortcutUpdateCompany);

              // Skip to the next Company.
              break;
            }

            console.log('Match Company For Name:' + companyName);
            console.log(potentialCompany);

            // Get the database User connected to the Company.
            const user = await db
              .select()
              .from(User)
              .where(eq(User.id, potentialCompany.userId));

            console.log('Company User');
            console.log(user);

            // Check if a matching User was found.
            if (user[0]) {
              // Define tracker for if a firm was found.
              let foundFirm = false;

              // Check through the list of found Firms for one with the same full name as the User.
              for (const firm of possibleFirms) {
                console.log('Possible Firm');
                console.log(firm);

                if (user[0].userName === firm.userName) {
                  // If a match is found, define that User for that Firm by their database Id.
                  const matchedFirm = await db
                    .update(Firm)
                    .set({ userId: user[0].id })
                    .where(eq(Firm.id, firm.id))
                    .returning();

                  console.log('Matched Firm');
                  console.log(matchedFirm);

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
                    const updatedCompany = await db
                      .update(Company)
                      .set({
                        bookkeeperConnected: addConnection,
                        firmName: connectedFirmName,
                      })
                      .where(eq(Company.id, potentialCompany.id))
                      .returning();

                    console.log('Updated Company');
                    console.log(updatedCompany);

                    // Track that the matching firm was found and continue to the next Company.
                    foundFirm = true;
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
              if (!foundFirm) {
                // If no potential related Firms are found, set success to false and push the Company name to the list of failed connections.
                success = false;
                failedCompanies.push(potentialCompany.name);
              }
            } else {
              // If no potential related Users are found, set success to false and push the Company name to the list of failed connections.
              success = false;
              failedCompanies.push(potentialCompany.name);
            }
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

// Updates a database Company object to be set as disconnected from the Synthetic Bookkeeper.
//    Done to prevent us from continuing to access that Company.
// Returns: A Query Result object.
export async function makeCompanyIncactive(): Promise<QueryResult> {
  try {
    // Get the current session to get the Company realm Id.
    const session = await getServerSession(options);

    // Check that the Company realm Id could be found.
    if (!session?.realmId) {
      // Return an error Query Result indicating the session could not be found.
      return {
        result: 'Error',
        message: 'Session could not be found.',
        detail:
          'The session containing the Company realm Id could not be found',
      };
    }

    // Find the Company in the database with the matching Id.
    const company = await db
      .select()
      .from(Company)
      .where(eq(Company.realmId, session.realmId));

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
