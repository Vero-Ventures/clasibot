'use server';
import { db } from '@/db/index';
import { Company, User, Firm, Subscription } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { QueryResult } from '@/types/QueryResult';
import { Stripe } from 'stripe';

// Create a new Stripe object with the private key.
// Used to check the users subscription before updating database.
const stripe = new Stripe(
  process.env.APP_CONFIG === 'production'
    ? (process.env.PROD_STRIPE_PRIVATE_KEY ?? '')
    : (process.env.DEV_STRIPE_PRIVATE_KEY ?? '')
);

// Takes the company name and user email from a QBO company invite.
// Returns: A Query Result object.
// Integration: Called when a regular company connection invite comes through.
export async function addCompanyConnection(
  userEmail: string,
  companyName: string
): Promise<QueryResult> {
  try {
    // Use the passed user email to find the related user from the database.
    const databaseUser = await db
      .select()
      .from(User)
      .where(eq(User.email, userEmail));

    // Check that a related user was found.
    if (databaseUser) {
      // Find the user's subscription in the database from the user ID.
      const userSubscription = await db
        .select()
        .from(Subscription)
        .where(eq(Subscription.userId, databaseUser[0].id));

      // Get the subscription status from Stripe by checking for customers with matching ID's.
      const subscription = await stripe.subscriptions.list({
        customer: userSubscription[0].stripeId!,
      });

      // Check the subscription is active and valid.
      const subStatus = subscription.data[0]?.status;

      // Continue if a valid subscription is found.
      if (subStatus) {
        // Check for companies in the database related to the found user and have that company name.
        const databaseCompanies = await db
          .select()
          .from(Company)
          .where(
            eq(Company.userId, databaseUser[0].id) &&
              eq(Company.name, companyName)
          );

        if (databaseCompanies) {
          // Update all the users companies in the database with that name and return a success message.
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
          // If no companies could be found, return an error message.
          return {
            result: 'Error',
            message: 'Company could not be found.',
            detail:
              'No Companies with that name were found belonging to the user with that email.',
          };
        }
      } else {
        // If the user was found, but had an invalid subscription, return an error message.
        return {
          result: 'Error',
          message: 'User subscription was invalid.',
          detail:
            'User subscription either did not exist or is not presently active.',
        };
      }
    } else {
      // If no matching users could be found, return an error message.
      return {
        result: 'Error',
        message: 'User could not be found.',
        detail: 'No Users in the database with that email could be found.',
      };
    }
  } catch (error) {
    // Catch any errors and return a response with the error message if it is present.
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

// Takes the accounting firm name and name of the inviting user from a QBO accounting invite.
// Returns: A Query Result object.
// Integration: Called when inital to an accounting firm invite comes through.
export async function addAccountingFirmConnection(
  connectedFirmName: string,
  userName: string
): Promise<QueryResult> {
  try {
    // Get all companies matching the passed firm name and user name.
    const existingFirm = await db
      .select()
      .from(Firm)
      .where(eq(Firm.name, connectedFirmName) && eq(Firm.userName, userName));

    // Check if an existing firm with that name exists.
    if (!existingFirm) {
      // If no existing furm exists, create it and return a success response.
      await db
        .insert(Firm)
        .values({ name: connectedFirmName, userName: userName });
      return {
        result: 'Success',
        message: 'Firm Created.',
        detail: 'An accounting firm with that name and user name was created.',
      };
    } else {
      // If a matching firm already exists, return an error message.
      return {
        result: 'Error',
        message: 'A Matching Firm Was Already In The Database.',
        detail:
          'A frim with that name and user name already exists in the database.',
      };
    }
  } catch (error) {
    // Catch any errors and return an error response with the error message if it is present.
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

// Takes a firm name and an array of company names from a QBO access update email.
// Returns: A Query Result object.
// Integration: Called when the permissions update email for an accounting firm comes through.
//    Important to inform users to wait for acceptance before giving permissions.
export async function addAccountingFirmCompanies(
  connectedFirmName: string,
  companyNames: string[]
): Promise<QueryResult> {
  try {
    // Create a variable to track the updates success and array to track failed companies.
    let success = true;
    const failedCompanies = [];

    // Check for an accounting firm with the passed name.
    const possibleFirms = await db
      .select()
      .from(Firm)
      .where(eq(Firm.name, connectedFirmName));

    // Create a variable to shortcut updates after a matching firms is found.
    let matchingUser;

    // Check if any possible firms were found.
    if (possibleFirms) {
      // Iterate through the company names passed from the email.
      for (const companyName of companyNames) {
        // Get all companies with a matching name.
        const matchingCompanies = await db
          .select()
          .from(Company)
          .where(eq(Company.name, companyName));

        // Iterate through matching companies if any are found.
        if (matchingCompanies) {
          for (const potentialCompany of matchingCompanies) {
            // If the matching user has already been found, update the company.
            if (matchingUser) {
              // Update the companies connection status and set an assosiated firm name.
              await db
                .update(Company)
                .set({
                  bookkeeperConnected: true,
                  firmName: connectedFirmName,
                })
                .where(eq(Company.id, potentialCompany.id));
              // Skip to the next company.
              break;
            }

            // Get the database user connected to the company.
            const user = await db
              .select()
              .from(User)
              .where(eq(User.id, potentialCompany.userId));

            // If a user is found, get their combined name.
            if (user[0]) {
              const fullName = user[0].firstName + ' ' + user[0].lastName;

              // Check through the list of found firms for one with the same full name as the user.
              for (const firm of possibleFirms) {
                if (fullName === firm.userName) {
                  // If a match is found, define that user for that firm by their database Id.
                  await db
                    .update(Firm)
                    .set({ userId: user[0].id })
                    .where(eq(Firm.id, firm.id));

                  // Find the user's subscription in the database by the user database Id.
                  const userSubscription = await db
                    .select()
                    .from(Subscription)
                    .where(eq(Subscription.userId, user[0].id));

                  // Get the subscription status from Stripe using a list of customers with matching ID's.
                  const subscription = await stripe.subscriptions.list({
                    customer: userSubscription[0].stripeId!,
                  });

                  // Check if the subscription is active and valid.
                  const subStatus = subscription.data[0]?.status;
                  if (subStatus) {
                    // If the matching users subscription is valid, record the related user for later shortcutting.
                    matchingUser = User.id;

                    // If the user has a valid subscription update the company connection status and related firm name.
                    await db
                      .update(Company)
                      .set({
                        bookkeeperConnected: true,
                        firmName: connectedFirmName,
                      })
                      .where(eq(Company.id, potentialCompany.id));

                    // Continue to the next company.
                    break;
                  } else {
                    // If a matching user is found, but the subscription is invalid, return an error to indicate success with an invalid subscription.
                    return {
                      result: 'Error',
                      message: 'User subscription was invalid.',
                      detail:
                        'A match was found but the users subscription either did not exist or is not presently active.',
                    };
                  }
                }
              }
              // If no potential related firms are found, set success to false and push the company name to the list of failed connections.
              success = false;
              failedCompanies.push(potentialCompany.name);
            } else {
              // If no potential related users are found, set success to false and push the company name to the list of failed connections.
              success = false;
              failedCompanies.push(potentialCompany.name);
            }
            // If no matches were found for the company name, set success to false and push the company name to the list of failed connections.
            success = false;
            failedCompanies.push(potentialCompany.name);
          }
        } else {
          // If no matching companies were found, set success to false and push the current company name to the list of failed connections.
          success = false;
          failedCompanies.push(companyName);
        }
      }
      // After checking all companies, either return a Query Result.
      if (success) {
        return {
          result: 'Success',
          message: 'All companies matched and activated.',
          detail:
            'The related user and firm for each company was found and the company was connected.',
        };
      } else {
        // On failure, return a stringified version of the array of failed connection companies.
        return {
          result: 'Error',
          message: 'One or more companies could not be found.',
          detail: JSON.stringify(failedCompanies),
        };
      }
    } else {
      // If no firms with a matching name are found, return an error.
      return {
        result: 'Error',
        message: 'No firms could be found.',
        detail: 'No firms with that name were found.',
      };
    }
  } catch (error) {
    // Catch any errors and return an error response with the error message if it is present.
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

// Takes a companies realm Id and sets it to inactive in the database.
// Returns: A Query Result object.
// Integration: Called by a frontend button that allows user to set a company to be disconnected.
//    Done when a user removes the connection through QuickBooks, required to be done in app as well to avoid issues.
export async function makeCompanyIncactive(
  realmId: string
): Promise<QueryResult> {
  try {
    // Find the company in the database with the matching ID.
    const company = await db
      .select()
      .from(Company)
      .where(eq(Company.realmId, realmId));

    // If a company is found, set its connection status to false.
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
      // If no matching company could be found, return an error result.
      return {
        result: 'Error',
        message: 'Company could not be found.',
        detail: 'No company with that realm ID could be found.',
      };
    }
  } catch (error) {
    // Catch any errors and return an error response with the error message if it is present.
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
