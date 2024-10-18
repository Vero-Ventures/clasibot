import { db } from '@/db/index';
import { Company, Subscription, User } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createCustomerID } from '@/actions/stripe';
import createDatabaseCompany from '@/actions/user-company/create-company';
import { refreshToken, refreshBackendToken } from '@/lib/refresh-token';
import NextAuth, { getServerSession } from 'next-auth';
import type {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from 'next';
import type { NextAuthOptions } from 'next-auth';
import { cookies } from 'next/headers';

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

// Define the client ID, secret, and wellknow URL for QuickBooks based on the environment.
const useID =
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
      clientId: useID,
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
            // Return the user info through the access token.
            return context.client.userinfo(context?.tokens?.access_token);
          } else {
            // Throw an error if the access token is not present.
            throw new Error('No access token');
          }
        },
      },

      // Define the profile function to call key values for the user profile.
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
        // If the account is found, update the values in the token, delete the realmId cookie, and return the token.
        token.userId = profile?.sub;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.realmId = cookies().get('realmId')?.value;
        token.expiresAt = account.expires_at;
        cookies().delete('realmId');
        return token;
      }
      // If no account is found, check the token is not expired and return it.
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

    // Define the behavior of callback function called on sign in.
    async signIn({ user }) {
      try {
        // Get the email and name of the user.
        const email = user.email;
        const [firstName, lastName] = user.name?.split(' ') ?? [];

        // Check if the realm ID could be found from the cookies and throw an error if it could not.
        if (!cookies().get('realmId')?.value) {
          throw 'Company ID could not be found for company creation.';
        }

        // Only reach this point if cookie is present so assert it is not-null.
        const companyID = cookies().get('realmId')!.value;

        // Check if the email was successful found from passed user.
        if (!email) {
          console.error('No user email found in session');
          // Return false to indicate that sign-in failed.
          return false;
        }

        // Find the user database objecte using the found email.
        const userData = await db
          .select()
          .from(User)
          .where(eq(User.email, email));

        // If no matching database user exists, create a new user in the database.
        if (userData.length === 0) {
          try {
            const newUser = await db
              .insert(User)
              .values({
                email,
                firstName,
                lastName,
                subscriptionId: null,
              })
              .returning();

            // Create a company object for the current company that is assosaited with the new user object.
            const companyData = await createDatabaseCompany(
              newUser[0].id,
              companyID
            );

            // Insert the newly created company object into the database.
            await db.insert(Company).values(JSON.parse(companyData));

            // Create a new blank subscription in the database for the user object.
            const newSubscription = await db
              .insert(Subscription)
              .values({
                userId: newUser[0].id,
                stripeId: null,
              })
              .returning();

            // Take the created subscription and update the database user with a connection to that subscription object.
            await db
              .update(User)
              .set({ subscriptionId: newSubscription[0].id })
              .where(eq(User.id, newUser[0].id));

            // Create a stripe customerID for the user and update the users subscription database object with it.
            await createCustomerID(newUser[0].id);
          } catch (createError) {
            // Catch any errors in user creation and log them.
            console.error('Error creating new user in db:', createError);
            // Return false to indicate that the new user could not be created and the sign in failed.
            return false;
          }
        } else {
          // If the user already exists in the database, get the database companies connected to the current user.
          const companies = await db
            .select()
            .from(Company)
            .where(eq(Company.userId, userData[0].id));

          // Use the realm ID of from the cookies to check if the current company is not present in the list of user database companies.
          if (!companies.some((company) => company.realmId === companyID)) {
            // If there is no assosaited company database object for the current realm Id, create a new company object.
            const companyData = await createDatabaseCompany(
              userData[0].id,
              companyID
            );

            // Insert the newly created company object into the database.
            await db.insert(Company).values(JSON.parse(companyData));
          }
        }
      } catch (error) {
        // Catch any errors in sign in process creation and log them.
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

// Define the backend values for the client ID and secret used in synthetic login processes.
// Values are based based on the environment configuration.
const useIDBackend =
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
      clientId: useIDBackend,
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
            // Return the user info through the access token.
            return context.client.userinfo(context?.tokens?.access_token);
          } else {
            // Throw an error if the access token is not present.
            throw new Error('No access token');
          }
        },
      },

      // Define the profile function to call key values for the user profile.
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
        // If the account is found, update the values in the token, delete the realmId cookie, and return the token.
        token.userId = profile?.sub;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.realmId = cookies().get('realmId')?.value;
        token.expiresAt = account.expires_at;
        cookies().delete('realmId');
        return token;
      }
      // If no account is found, check the token is not expired and return it.
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

    // Define the behavior of callback function called on sign in.
    async signIn({ user }) {
      try {
        // Get the email of the current user
        const email = user.email;

        // Check if the email was successful found from passed user.
        if (!email) {
          console.error('No user email found in session');
          // Return false to indicate that sign-in failed.
          return false;
        }
      } catch (error) {
        // Catch any errors in sign in process creation and log them.
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
