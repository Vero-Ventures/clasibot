'use server';

import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

import { db } from '@/db/index';
import { Company, User, Firm, Subscription } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

import { Stripe } from 'stripe';

import type { QueryResult } from '@/types/index';

// Create a Stripe object with the private key, used to check the User Subscription.
const stripe = new Stripe(
  process.env.APP_CONFIG === 'production'
    ? (process.env.PROD_STRIPE_PRIVATE_KEY ?? '')
    : (process.env.DEV_STRIPE_PRIVATE_KEY ?? '')
);

// Takes: The User and Company name from a QBO Company invite.
// Returns: A Query Result for finding and updating the Comapany.
export async function addCompanyConnection(
  userName: string,
  companyName: string
): Promise<QueryResult> {
  try {
    // Use the unique Email to find the related User.
    const databaseUsers = await db
      .select()
      .from(User)
      .where(eq(User.userName, userName));

    // Iterate through the Users to check their Subscription status and Companies.
    for (const user of databaseUsers) {
      // Find the User Subscription from the User Id.
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
        // Get all the Companies assosiated with the User.
        const userCompanies = await db
          .select()
          .from(Company)
          .where(eq(Company.userId, user.id));

        // Iterate through the Companies to find the one to update.
        for (const company of userCompanies) {
          // Check if the unique Company name matches the passed name.
          if (company.name === companyName) {
            // If a match is found, update the Company and return a success Query Result.
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

// Takes: The Firm name and User name from a QBO Firm invite.
// Returns: A Query Result for adding the Firm.
export async function addAccountingFirmConnection(
  connectedFirmName: string,
  userName: string
): Promise<QueryResult> {
  try {
    // Get all Firms matching the passed Firm and User name.
    const existingFirm = await db
      .select()
      .from(Firm)
      .where(
        and(eq(Firm.name, connectedFirmName), eq(Firm.userName, userName))
      );

    // Check if an existing Firm was found.
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

// Takes: A Firm name and an array of Company names from a QBO client access update Email.
// Returns: A Query Result.
export async function changeAccountingFirmCompanyAccess(
  connectedFirmName: string,
  companyNames: string[],
  addConnection: boolean
): Promise<QueryResult> {
  try {
    // Create a variable to track the overall update success and array to track Companies that failed to connect.
    let success = true;
    const failedCompanies = [];

    // Check for an Firm with the passed name.
    const possibleFirms = await db
      .select()
      .from(Firm)
      .where(eq(Firm.name, connectedFirmName));

    // Create a variable track the matching Firm if found to shortcut later updates.
    let matchingUser;

    // Check that any possible Firms were found.
    if (possibleFirms.length > 0) {
      // Iterate through the Company names passed from the Email.
      for (const companyName of companyNames) {
        // Get all Companies with a matching name.
        const matchingCompanies = await db
          .select()
          .from(Company)
          .where(eq(Company.name, companyName));

        // Iterate through matching Companies, if any are found.
        if (matchingCompanies.length > 0) {
          for (const potentialCompany of matchingCompanies) {
            // If the matching User has already been found, update the Company.
            if (matchingUser) {
              // Update the Company connection status and set the assosiated Firm name.
              await db
                .update(Company)
                .set({
                  bookkeeperConnected: addConnection,
                  firmName: connectedFirmName,
                })
                .where(eq(Company.id, potentialCompany.id))
                .returning();

              // Skip to the next Company.
              break;
            }

            // Get the User connected to the current Company.
            const user = await db
              .select()
              .from(User)
              .where(eq(User.id, potentialCompany.userId));

            // Check if a matching User was found.
            if (user[0]) {
              // Define tracker for if a matching Firm is found.
              let foundFirm = false;

              // Check through the list of found Firms.
              for (const firm of possibleFirms) {
                // Check if the name of the User matches the name of the User of the Firm.
                if (user[0].userName === firm.userName) {
                  // If a match is found, connect that User to that Firm by their database Id.
                  await db
                    .update(Firm)
                    .set({ userId: user[0].id })
                    .where(eq(Firm.id, firm.id))
                    .returning();

                  // Find the Subscription with the User Id.
                  const userSubscription = await db
                    .select()
                    .from(Subscription)
                    .where(eq(Subscription.userId, user[0].id));

                  // Get the Subscription status from Stripe by getting a list of Customers with matching Id.
                  const subscription = await stripe.subscriptions.list({
                    customer: userSubscription[0].stripeId!,
                  });

                  // Check if the Subscription is active and valid.
                  const subStatus = subscription.data[0]?.status;
                  if (subStatus) {
                    // If the Subscription is valid, record the related User for updating later Companies.
                    matchingUser = User.id;

                    // Update the Company connection status and related Firm name.
                    await db
                      .update(Company)
                      .set({
                        bookkeeperConnected: addConnection,
                        firmName: connectedFirmName,
                      })
                      .where(eq(Company.id, potentialCompany.id))
                      .returning();

                    // Record that a matching Firm was found and continue to the next Company.
                    foundFirm = true;
                    break;
                  } else {
                    // If a matching User is found, but the Subscription is invalid, return an error to indicate success with an invalid Subscription.
                    return {
                      result: 'Error',
                      message: 'User Subscription was invalid.',
                      detail:
                        'A Match Was Found But The User Subscription Either Did Not Exist Or Is Inactive.',
                    };
                  }
                }
              }
              if (!foundFirm) {
                // If no potential related Firms are found, set success to false to indicate failure.
                // Push the Company name to the list of failed connections.
                success = false;
                failedCompanies.push(potentialCompany.name);
              }
            } else {
              // If no potential related Users are found, set success to false to indicate failure.
              // Push the Company name to the list of failed connections.
              success = false;
              failedCompanies.push(potentialCompany.name);
            }
          }
        } else {
          // If no matching Companies were found, set success to false to indicate failure.
          // Push the Company name to the list of failed connections.
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
        // On failure, return a stringified array of Companies that failed to Connect.
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
        detail: 'No Firms With That Name Were Found.',
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

// Returns: A Query Result.
export async function makeCompanyIncactive(): Promise<QueryResult> {
  try {
    // Get the current session to get the realm Id.
    const session = await getServerSession(options);

    // Check that the realm Id could be found.
    if (!session?.realmId) {
      // Return an error Query Result indicating the realm Id could not be found.
      return {
        result: 'Error',
        message: 'Session could not be found.',
        detail: 'The Session Containing The Realm Id Could Not Be Found',
      };
    }

    // Find the matching Company using the unique realm Id.
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
        detail: 'No Company With That Realm Id Could Be Found.',
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
