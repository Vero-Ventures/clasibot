'use server';
import { db } from '@/db/index';
import { Company, User, Firm, Subscription } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { QueryResult } from '@/types/QueryResult';
import { Stripe } from 'stripe';

// Create a new Stripe object with the private key.
const stripe = new Stripe(
  process.env.APP_CONFIG === 'production'
    ? (process.env.PROD_STRIPE_PRIVATE_KEY ?? '')
    : (process.env.DEV_STRIPE_PRIVATE_KEY ?? '')
);

export async function addCompanyConnection(
  userEmail: string,
  companyName: string
): Promise<QueryResult> {
  try {
    // Use the email to get the user from the database for their company ID.
    const databaseUser = await db
      .select()
      .from(User)
      .where(eq(User.email, userEmail));

    if (databaseUser) {
      // Find the user's subscription in the database by the ID from the user.
      const userSubscription = await db
        .select()
        .from(Subscription)
        .where(eq(Subscription.userId, databaseUser[0].id));

      // Get the subscription status from Stripe using a list of customers with matching ID's.
      const subscription = await stripe.subscriptions.list({
        customer: userSubscription[0].stripeId!,
      });

      // Check and return if the subscription is active and valid.
      const subStatus = subscription.data[0]?.status;

      // Continue if a valid subscription is found.
      if (subStatus) {
        // Check the company exists in the database using the user ID and company name as unique identifier.
        const databaseCompany = await db
          .select()
          .from(Company)
          .where(
            eq(Company.userId, databaseUser[0].id) &&
              eq(Company.name, companyName)
          );

        if (databaseCompany) {
          // Update the database object connected status and return a success message.
          await db
            .update(Company)
            .set({ bookkeeperConnected: true })
            .where(eq(Company.id, databaseCompany[0].id));

          return {
            result: 'Success',
            message: 'Bookkeeper connected.',
            detail: 'Bookkeeper connection to company set to true.',
          };
        } else {
          return {
            result: 'Error',
            message: 'Company could not be found.',
            detail:
              'No Companies with that name were found belonging to the user with that email.',
          };
        }
      } else {
        return {
          result: 'Error',
          message: 'User subscription was invalid.',
          detail:
            'User subscription either did not exist or is not presently active.',
        };
      }
    } else {
      return {
        result: 'Error',
        message: 'User could not be found.',
        detail: 'No Users in the database with that email could be found.',
      };
    }
  } catch (error) {
    if (error instanceof Error) {
      return {
        result: 'Error',
        message: 'An Unexpected Error Occured',
        detail: error.message,
      };
    } else {
      return {
        result: 'Error',
        message: 'An Unexpected Error Occured',
        detail: 'N/A',
      };
    }
  }
}

export async function addAccountingFirmConnection(
  connectedFirmName: string,
  userName: string
): Promise<QueryResult> {
  try {
    // Get all companies with a matching name.
    const existingFirm = await db
      .select()
      .from(Firm)
      .where(
        eq(Firm.name, connectedFirmName) && eq(Firm.userName, Firm.userName)
      );

    if (!existingFirm) {
      await db
        .insert(Firm)
        .values({ name: connectedFirmName, userName: userName });
      return {
        result: 'Success',
        message: 'Firm Created.',
        detail: 'An accounting firm with that name and user name was created.',
      };
    } else {
      return {
        result: 'Error',
        message: 'A Matching Firm Was Found.',
        detail:
          'A frim with that name and user name already exists in the database.',
      };
    }
  } catch (error) {
    if (error instanceof Error) {
      return {
        result: 'Error',
        message: 'An Unexpected Error Occured',
        detail: error.message,
      };
    } else {
      return {
        result: 'Error',
        message: 'An Unexpected Error Occured',
        detail: 'N/A',
      };
    }
  }
}

export async function addAccountingFirmCompanies(
  connectedFirmName: string,
  companyNames: string[]
): Promise<QueryResult> {
  try {
    // Make a variable to track the updates success.
    let success = true;
    const failedCompanies = [];

    // Check for an accounting firm with the passed name.
    const possibleFirms = await db
      .select()
      .from(Firm)
      .where(eq(Firm.name, connectedFirmName));

    // If matching firms are found create a variable to track a matched user.
    let matchingUser;

    if (possibleFirms) {
      // Iterate through the company names you were granted access too.
      for (const companyName of companyNames) {
        // Get all companies with a matching name.
        const matchingCompanies = await db
          .select()
          .from(Company)
          .where(eq(Company.name, companyName));

        // Iterate through matching companies or return an error result if none are found.
        if (matchingCompanies) {
          for (const potentialCompany of matchingCompanies) {
            // If the matching user has already been found, update the company.
            if (matchingUser) {
              // Update the company connection status and firm name.
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

            // Get the user related to the company.
            const user = await db
              .select()
              .from(User)
              .where(eq(User.id, potentialCompany.userId));

            // If a user is found, get their combined name
            if (user[0]) {
              // Check if the combined names of the user matches the passed name.
              const fullName = user[0].firstName + ' ' + user[0].lastName;

              // Check through the list of found firms for one with the same name.
              for (const firm of possibleFirms) {
                if (fullName === firm.userName) {
                  // If a match is found define the user for that firm.
                  await db
                    .update(Firm)
                    .set({ userId: user[0].id })
                    .where(eq(Firm.id, firm.id));

                  // Find the user's subscription in the database by the ID from the user.
                  const userSubscription = await db
                    .select()
                    .from(Subscription)
                    .where(eq(Subscription.userId, user[0].id));

                  // Get the subscription status from Stripe using a list of customers with matching ID's.
                  const subscription = await stripe.subscriptions.list({
                    customer: userSubscription[0].stripeId!,
                  });

                  // Check and return if the subscription is active and valid.
                  const subStatus = subscription.data[0]?.status;
                  if (subStatus) {
                    // If the matching users subscription is valid, record the related user.
                    matchingUser = User.id;

                    // If the user has a valid subscription update the company connection status and firm name.
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
                    // If a matching user is found, but the subscription is invalid, return an error.
                    return {
                      result: 'Error',
                      message: 'User subscription was invalid.',
                      detail:
                        'A match was found but the users subscription either did not exist or is not presently active.',
                    };
                  }
                }
              }
              // If no potential related firms are found, set success to false and push the company to the list of failed connections.
              success = false;
              failedCompanies.push(potentialCompany.name);
            } else {
              // If no potential related users are found, set success to false and push the company to the list of failed connections.
              success = false;
              failedCompanies.push(potentialCompany.name);
            }
            // If no match was found for the company, set success to false and push the company to the list of failed connections.
            success = false;
            failedCompanies.push(potentialCompany.name);
          }
        } else {
          // If no matching company was found, set success to false and push the company to the list of failed connections.
          success = false;
          failedCompanies.push(companyName);
        }
      }
      if (success) {
        return {
          result: 'Success',
          message: 'All companies matched and activated.',
          detail:
            'The related user and firm for each company was found and the company was connected.',
        };
      } else {
        return {
          result: 'Error',
          message: 'One or more companies could not be found.',
          detail: JSON.stringify(failedCompanies),
        };
      }
    } else {
      // If no companies with a matching name are found, return an error.
      return {
        result: 'Error',
        message: 'No firms could be found.',
        detail: 'No firms with that name were found.',
      };
    }
  } catch (error) {
    if (error instanceof Error) {
      return {
        result: 'Error',
        message: 'An Unexpected Error Occured',
        detail: error.message,
      };
    } else {
      return {
        result: 'Error',
        message: 'An Unexpected Error Occured',
        detail: 'N/A',
      };
    }
  }
}

export async function makeCompanyIncactive(
  realmId: string
): Promise<QueryResult> {
  try {
    // Check for a company in the database with the matching ID.
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
        message: 'Bookkeeper disconnected.',
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
    if (error instanceof Error) {
      return {
        result: 'Error',
        message: 'An Unexpected Error Occured',
        detail: error.message,
      };
    } else {
      return {
        result: 'Error',
        message: 'An Unexpected Error Occured',
        detail: 'N/A',
      };
    }
  }
}

export async function reactivateExistingCompany(
  realmId: string
): Promise<QueryResult> {
  try {
    // Check for a company in the database with the matching ID.
    const company = await db
      .select()
      .from(Company)
      .where(eq(Company.realmId, realmId));

    // If a company is found, set its connection status to true.
    if (company[0]) {
      await db
        .update(Company)
        .set({ bookkeeperConnected: true })
        .where(eq(Company.id, company[0].id));

      // After updating the connection, return a success result.
      return {
        result: 'Success',
        message: 'Bookkeeper re-connected.',
        detail: 'Bookkeeper connection to company set to true.',
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
    if (error instanceof Error) {
      return {
        result: 'Error',
        message: 'An Unexpected Error Occured',
        detail: error.message,
      };
    } else {
      return {
        result: 'Error',
        message: 'An Unexpected Error Occured',
        detail: 'N/A',
      };
    }
  }
}
