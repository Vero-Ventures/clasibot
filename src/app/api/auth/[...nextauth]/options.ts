import { cookies } from 'next/headers';
import type {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from 'next';

import NextAuth, { getServerSession } from 'next-auth';
import type { NextAuthOptions } from 'next-auth';

import { refreshToken, refreshBackendToken } from '@/lib/refresh-token';

import { db } from '@/db/index';
import { Company, Subscription, User } from '@/db/schema';
import { eq } from 'drizzle-orm';

import { createCustomer } from '@/actions/stripe';

// Export the config options to work with Next Auth.
export const config = {
  providers: [],
} satisfies NextAuthOptions;

// Export auth used in server contexts.
export function auth(
  ...args:
    | [GetServerSidePropsContext['req'], GetServerSidePropsContext['res']]
    | [NextApiRequest, NextApiResponse]
    | []
) {
  return getServerSession(...args, config);
}

// Define the frontend values for the client Id, secret, and wellknow URL for QuickBooks.
// Values are based on the environment configuration.
const useId =
  process.env.APP_CONFIG === 'production'
    ? process.env.PROD_CLIENT_ID
    : process.env.DEV_CLIENT_ID;
const useSecret =
  process.env.APP_CONFIG === 'production'
    ? process.env.PROD_CLIENT_SECRET
    : process.env.DEV_CLIENT_SECRET;
const wellknowURL =
  process.env.APP_CONFIG === 'production'
    ? 'https://developer.api.intuit.com/.well-known/openid_configuration'
    : 'https://developer.api.intuit.com/.well-known/openid_sandbox_configuration';

export const options: NextAuthOptions = {
  // Set the values for QuickBooks connection through OAuth.
  providers: [
    {
      clientId: useId,
      clientSecret: useSecret,
      id: 'quickbooks',
      name: 'QuickBooks',
      type: 'oauth',
      wellKnown: wellknowURL,
      authorization: {
        params: {
          scope:
            'com.intuit.quickbooks.accounting openid profile email phone address',
        },
      },

      // Define an endpoint to get the user information.
      userinfo: {
        async request(context) {
          // Check if the access token is present in the context.
          if (context?.tokens?.access_token) {
            // Get and return the user info through the access token.
            return context.client.userinfo(context?.tokens?.access_token);
          } else {
            // Throw an error if the access token is not present.
            throw new Error('No access token');
          }
        },
      },

      // Define the profile function which calls key values for the user profile.
      idToken: true,
      checks: ['pkce', 'state'],
      profile(profile) {
        // Return the user profile data.
        return {
          id: profile.sub,
          name: `${profile.givenName} ${profile.familyName}`,
          email: profile.email,
        };
      },
    },
  ],

  callbacks: {
    // Define the JWT callback to get the token data.
    async jwt({ token, account, profile }) {
      if (account) {
        // If the account is found, set the values in the token, delete the realm Id cookie, and return the token.
        token.userId = profile?.sub;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.realmId = cookies().get('realmId')?.value;
        token.expiresAt = account.expires_at;
        cookies().delete('realmId');
        return token;
      }
      // If no account is found, check that the token is not expired and return it.
      if (token.expiresAt && Date.now() / 1000 < token.expiresAt) {
        return token;
      }
      // If no account is found and token is expired, refresh the token and return the new token.
      return refreshToken(token);
    },

    // Define the session callback to get the session data.
    async session({ session, token }) {
      // Set the session fields data from the passed token and return the session object.
      session.userId = token.userId;
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.realmId = token.realmId;
      session.expiresAt = token.expiresAt;
      return session;
    },

    // Define the behavior of callback function called on frontend sign in.
    async signIn({ user }) {
      try {
        // Get the Email and name of the User.
        const email = user.email;
        const userName = user.name;

        // Check if the realm Id can be found from the cookies.
        if (!cookies().get('realmId')?.value) {
          // Throw an error to be caught and logged at the end of sign in.
          throw 'Company Id could not be found for Company creation.';
        }

        // Only reach this point if realm Id is present so define it as not null.
        const companyId = cookies().get('realmId')!.value;

        // Check if the Email was successfuly found from the passed User.
        if (!email) {
          // If no Email is found, return false to indicate that sign-in failed.
          console.error('No user Email found in session');
          return false;
        }

        // Check if the User name was successful found from passed User.
        if (!userName) {
          // If no User name is found, false to indicate that sign-in failed.
          console.error('No User name found in session');
          return false;
        }

        // Find the database User object with the User email.
        const userData = await db
          .select()
          .from(User)
          .where(eq(User.email, email));

        // Check for any existing database User objects matching the current User.
        if (userData.length === 0) {
          try {
            // If no matching database User exists (new User), create a new User object in the database.
            const newUser = await db
              .insert(User)
              .values({
                email,
                userName,
                subscriptionId: null,
              })
              .returning();

            // Create a Company object that is assosaited with the new User.
            const newCompany = {
              realmId: companyId,
              userId: newUser[0].id,
              name: 'unset',
              industry: '',
              bookkeeperConnected: false,
              firmName: null,
            };

            // Insert the newly created Company object into the database.
            await db.insert(Company).values(newCompany);

            // Create a blank Subscription in the database for the new User object.
            const newSubscription = await db
              .insert(Subscription)
              .values({
                userId: newUser[0].id,
                stripeId: null,
              })
              .returning();

            // Update the database to connect the User and Subscription objects.
            await db
              .update(User)
              .set({ subscriptionId: newSubscription[0].id })
              .where(eq(User.id, newUser[0].id));

            // Create a Stripe Customer Id for the User and update the database Subscription object with it.
            const createdCustomer = await createCustomer(newUser[0].id);
            const createdCustomerResult = await createdCustomer.json();

            // Check the result of Customer create and return an error if it failed.
            if (createdCustomerResult.error) {
              console.error(
                'Error creating new user in db:',
                createdCustomerResult.error
              );
              return false;
            }
          } catch (createError) {
            // Catch any errors in User creation and log them.
            console.error('Error creating new user in db:', createError);
            // Return false to indicate that the new User could not be created and the sign in failed.
            return false;
          }
        } else {
          // If the User already exists in the database, get the database Companies connected to the current User.
          const companies = await db
            .select()
            .from(Company)
            .where(eq(Company.userId, userData[0].id));

          // Use the current Company realm Id to check if it present in the list of the User database Companies.
          if (!companies.some((company) => company.realmId === companyId)) {
            // Create a new Company object that is assosaited with the new User.
            const newCompany = {
              realmId: companyId,
              userId: userData[0].id,
              name: 'unset',
              industry: '',
              bookkeeperConnected: false,
              firmName: null,
            };

            // Insert the newly created Company object into the database.
            await db.insert(Company).values(newCompany);
          }
        }
      } catch (error) {
        // Catch any errors and log them.
        console.error('Error during sign-in:', error);
        // Return false to indicate that the sign in process failed.
        return false;
      }
      // Return true to indicate that sign-in process was successful.
      return true;
    },
  },
  // Define the session max age (24 Hours).
  session: {
    maxAge: 24 * 60 * 60,
  },
};

// Define the backend values for the client Id and secret used in synthetic login processes.
// Values are based based on the environment configuration.
const useIdBackend =
  process.env.APP_CONFIG === 'production'
    ? process.env.BACKEND_PROD_CLIENT_ID
    : process.env.BACKEND_DEV_CLIENT_ID;
const useSecretBackend =
  process.env.APP_CONFIG === 'production'
    ? process.env.BACKEND_PROD_CLIENT_SECRET
    : process.env.BACKEND_DEV_CLIENT_SECRET;

export const backendOptions: NextAuthOptions = {
  // Set the values for QuickBooks connection through OAuth.
  providers: [
    {
      clientId: useIdBackend,
      clientSecret: useSecretBackend,
      id: 'quickbooks',
      name: 'QuickBooks',
      type: 'oauth',
      wellKnown: wellknowURL,
      authorization: {
        params: {
          scope:
            'com.intuit.quickbooks.accounting openid profile email phone address',
        },
      },

      // Define an endpoint to get the user information.
      userinfo: {
        async request(context) {
          // Check if the access token is present in the context.
          if (context?.tokens?.access_token) {
            // Get and return the user info through the access token.
            return context.client.userinfo(context?.tokens?.access_token);
          } else {
            // Throw an error if the access token is not present.
            throw new Error('No access token');
          }
        },
      },

      // Define the profile function which calls key values for the user profile.
      idToken: true,
      checks: ['pkce', 'state'],
      profile(profile) {
        // Return the user profile data.
        return {
          id: profile.sub,
          name: `${profile.givenName} ${profile.familyName}`,
          email: profile.email,
        };
      },
    },
  ],

  callbacks: {
    // Define the JWT callback to get the token data.
    async jwt({ token, account, profile }) {
      if (account) {
        // If the account is found, set the values in the token, delete the realm Id cookie, and return the token.
        token.userId = profile?.sub;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.realmId = cookies().get('realmId')?.value;
        token.expiresAt = account.expires_at;
        cookies().delete('realmId');
        return token;
      }
      // If no account is found, check that the token is not expired and return it.
      if (token.expiresAt && Date.now() / 1000 < token.expiresAt) {
        return token;
      }
      // If no account is found and token is expired, refresh the token and return the new token.
      return refreshBackendToken(token);
    },

    // Define the session callback to get the session data.
    async session({ session, token }) {
      // Set the session fields data from the passed token and return the session object.
      session.userId = token.userId;
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.realmId = token.realmId;
      session.expiresAt = token.expiresAt;
      return session;
    },

    // Define the behavior of callback function called on backend sign in.
    async signIn({ user }) {
      try {
        // Get the Email of the current User
        const email = user.email;

        // Check if the Email was successfuly found from the passed User.
        if (!email) {
          // If no Email is found, return false to indicate that sign-in failed.
          console.error('No user Email found in session');
          return false;
        }
      } catch (error) {
        // Catch any errors and log them.
        console.error('Error during sign-in:', error);
        // Return false to indicate that the sign in process failed.
        return false;
      }
      // Return true to indicate that sign-in process was successful.
      return true;
    },
  },
  // Define the session max age (24 Hours).
  session: {
    maxAge: 24 * 60 * 60,
  },
};

export default NextAuth(options);
