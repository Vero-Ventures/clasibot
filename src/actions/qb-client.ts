/**
 * Defines a helper method to create a QuickBooks API object using the server session.
 * QB object is used to make QuickBooks API calls.
 */
'use server';
import QB from 'node-quickbooks';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

// Create a QuickBooks client object.
export async function createQBObject() {
  // Get the server session and save it as a constant.
  const session = await getServerSession(options);

  // Record the server session values.
  const oauthToken = session?.accessToken;
  const realmId = session?.realmId;
  const refreshToken = session?.refreshToken;

  // Determine sandbox status using ENV.
  const useSandbox = process.env.APP_CONFIG !== 'production';

  // Define the variables for the QuickBooks client ID and secret.
  let useID;
  let useSecret;

  // Set the QuickBooks client ID and secret based on the environment.
  if (process.env.APP_CONFIG === 'production') {
    useID = process.env.PROD_CLIENT_ID;
    useSecret = process.env.PROD_CLIENT_SECRET;
  } else {
    useID = process.env.DEV_CLIENT_ID;
    useSecret = process.env.DEV_CLIENT_SECRET;
  }

  const minorVersion = 73;

  // Create the QuickBooks API calls object.
  const qbo = new QB(
    useID,
    useSecret,
    oauthToken,
    false,
    realmId,
    useSandbox,
    false,
    minorVersion,
    '2.0',
    refreshToken
  );

  return qbo;
}
