import { db } from '@/db/index';
import { Subscription, User } from '@/db/schema';
import { refreshToken } from '@/lib/refresh-token';
import NextAuth, { getServerSession } from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import type {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from 'next';
import { cookies } from 'next/headers';
import { createCustomerID } from '@/actions/stripe';
import { eq } from 'drizzle-orm';

export const config = {
  providers: [],
} satisfies NextAuthOptions;

// Used in server contexts
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
  // Info for QuickBooks connection through OAuth using enviroment specific values.
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

      // Define the userinfo endpoint to get the user profile.
      userinfo: {
        async request(context) {
          // Check if the access token is available in the context.
          if (context?.tokens?.access_token) {
            // Return the user profile using the access token.
            return context.client.userinfo(context?.tokens?.access_token);
          } else {
            // Throw an error if the access token is not available.
            throw new Error('No access token');
          }
        },
      },

      // Define the profile function to get the user profile.
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
        // If the account is found, update the values, delete the realmId cookie, and return the token.
        token.userId = profile?.sub;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.realmId = cookies().get('realmId')?.value;
        token.expiresAt = account.expires_at;
        cookies().delete('realmId');
        return token;
      }
      // If the account is not expired return the token.
      if (token.expiresAt && Date.now() / 1000 < token.expiresAt) {
        return token;
      }
      // If the token is expired, refresh the token and return the new token.
      return refreshToken(token);
    },

    // Define the session callback to get the session data.
    async session({ session, token }) {
      // Set the session fields with the token data and return the session.
      session.userId = token.userId;
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.realmId = token.realmId;
      session.expiresAt = token.expiresAt;
      return session;
    },

    // Define the signIn callback to sign in the user.
    async signIn({ user }) {
      try {
        const email = user.email;
        const [firstName, lastName] = user.name?.split(' ') ?? [];

        // Check if the user email is available.
        if (!email) {
          console.error('No user email found in session');
          // Return false to indicate that sign-in failed.
          return false;
        }

        // Find the user data in the database using the email.
        const userData = await db
          .select()
          .from(User)
          .where(eq(User.email, email));

        // If the user does not exist, create a new user in the database.
        if (userData.length === 0) {
          try {
            // Create a new user in the database.
            const newUser = await db
              .insert(User)
              .values({
                email,
                firstName,
                lastName,
                industry: '',
                subscriptionId: null,
              })
              .returning();

            // Create a new blank subscription in the database, and a user that contains the subscription.
            const newSubscription = await db
              .insert(Subscription)
              .values({
                userId: newUser[0].id,
                stripeId: null,
              })
              .returning();

            // Update the user with the connection back to the subscription.
            await db
              .update(User)
              .set({ subscriptionId: newSubscription[0].id })
              .where(eq(User.id, newUser[0].id));

            console.log('New user created:', newUser[0]);

            // Create the stripe customerID for the user.
            await createCustomerID(newUser[0].id);
          } catch (createError) {
            // Log an error with the error message.
            console.error('Error creating new user in db:', createError);
            // Return false to indicate that the new user could not be created and the sign in failed.
            return false;
          }
        }
      } catch (error) {
        // Log an error and return false to indicate there was an error during sign-in.
        console.error('Error during sign-in:', error);
        return false;
      }
      // Return true to indicate that sign-in was successful.
      return true;
    },
  },
  // Define the session max age.
  session: {
    maxAge: 24 * 60 * 60,
  },
};

export default NextAuth(options);
