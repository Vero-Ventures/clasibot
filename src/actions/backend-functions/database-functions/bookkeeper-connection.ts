'use server';
import { db } from '@/db/index';
import { Company, User, Subscription } from '@/db/schema';
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
}

export async function addAccountingFirmConnection(
  userName: string,
  connectedFirmName: string,
  companyName: string
): Promise<QueryResult> {
  // Get all companies with a matching name.
  const matchingCompanies = await db
    .select()
    .from(Company)
    .where(eq(Company.name, companyName));

  // Iterate through matching companies or return an error result if none are found.
  if (matchingCompanies) {
    // Check the user related to each company.
    for (const potentialCompany of matchingCompanies) {
      const user = await db
        .select()
        .from(User)
        .where(eq(User.id, potentialCompany.userId));
      if (user[0]) {
        // Check if the combined names of the user matches the passed name.
        const fullName = user[0].firstName + ' ' + user[0].lastName;
        if (fullName === userName) {
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
            // If the user has a valid subscription update the company connection status and firm name.
            await db
              .update(Company)
              .set({ bookkeeperConnected: true, firmName: connectedFirmName })
              .where(eq(Company.id, potentialCompany.id));

            return {
              result: 'Success',
              message: 'Bookkeeper connected.',
              detail: 'Bookkeeper connection to company set to true.',
            };
          } else {
            return {
              result: 'Error',
              message: 'User subscription was invalid.',
              detail:
                'User subscription either did not exist or is not presently active.',
            };
          }
        }
      }
    }
    // If not matches are found, return an error message.
    return {
      result: 'Error',
      message: 'No companies for that user could be found.',
      detail: 'No Companies with that name related to the user could be found.',
    };
  } else {
    // If no companies with a matching name are found, return an error.
    return {
      result: 'Error',
      message: 'No companies could be found.',
      detail: 'No Companies with that name were found.',
    };
  }
}

export async function makeCompanyIncactive(
  realmId: string
): Promise<QueryResult> {
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
}

export async function reactivateExistingCompany(
  realmId: string
): Promise<QueryResult> {
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
}
