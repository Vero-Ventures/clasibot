'use server';

import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

import QB from 'node-quickbooks';

// Returns: A QuickBooks object used for API calls.
export async function getQBObject() {
  // Define default development values for the QuickBooks client Id and secret.
  let useId = process.env.DEV_CLIENT_ID;
  let useSecret = process.env.DEV_CLIENT_SECRET;

  // Update the QuickBooks client Id and secret if using production configuration.
  if (process.env.APP_CONFIG === 'production') {
    useId = process.env.PROD_CLIENT_ID;
    useSecret = process.env.PROD_CLIENT_SECRET;
  }

  // Get the server to find values needed for QB object creation.
  const session = await getServerSession(options);

  // Record the relevant values from the session needed for QBO connection.
  const oauthToken = session?.accessToken;
  const realmId = session?.realmId;
  const refreshToken = session?.refreshToken;

  // Determine sandbox status using app configuration.
  const useSandbox = process.env.APP_CONFIG !== 'production';

  // Define the API version used by the current codebase.
  const minorVersion = 73;

  // Create and return the QuickBooks API calls object.
  const qbo = new QB(
    useId,
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
