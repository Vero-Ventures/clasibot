'use server';

import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

import QB from 'node-quickbooks';

import type { LoginTokens } from '@/types/index';

// Create a QuickBooks client object for frontend functions.
// Returns: A QuickBooks object used for API calls.
export async function getQBObject() {
  // Define variables for the QuickBooks client Id and secret.
  let useId;
  let useSecret;

  // Set the QuickBooks client Id and secret based on the environment.
  if (process.env.APP_CONFIG === 'production') {
    useId = process.env.PROD_CLIENT_ID;
    useSecret = process.env.PROD_CLIENT_SECRET;
  } else {
    useId = process.env.DEV_CLIENT_ID;
    useSecret = process.env.DEV_CLIENT_SECRET;
  }

  // Get the server to find values needed for QB object creation.
  const session = await getServerSession(options);

  // Record the relevant values from the session needed for QBO connection.
  const oauthToken = session?.accessToken;
  const realmId = session?.realmId;
  const refreshToken = session?.refreshToken;

  // Call and return the QB object creation method.
  return createQBObject(useId!, useSecret!, oauthToken, realmId, refreshToken);
}

// Create a QuickBooks client object for backend functions.
// Takes: A set of synthetic Login Tokens and a Company realm Id.
// Returns: A QuickBooks object used for API calls.
export async function getQBObjectWithSession(
  loginTokens: LoginTokens,
  companyId: string
) {
  // Define variables for the QuickBooks client Id and secret.
  let useId;
  let useSecret;

  // Set the QuickBooks backend client Id and secret based on the environment.
  if (process.env.APP_CONFIG === 'production') {
    useId = process.env.BACKEND_PROD_CLIENT_ID;
    useSecret = process.env.BACKEND_PROD_CLIENT_SECRET;
  } else {
    useId = process.env.BACKEND_DEV_CLIENT_ID;
    useSecret = process.env.BACKEND_DEV_CLIENT_SECRET;
  }

  // Record the relevant values from the session needed for QBO connection.
  const oauthToken = loginTokens.accessToken;
  const realmId = companyId;
  const refreshToken = loginTokens.refreshToken;

  // Call and return the QB object creation method.
  return createQBObject(useId, useSecret, oauthToken, realmId, refreshToken);
}

// Takes: Possibly undefined variables used in QuickBooks object creation.
// Returns: A QuickBooks object used for API calls.
function createQBObject(
  useId: string | undefined,
  useSecret: string | undefined,
  oauthToken: string | undefined,
  realmId: string | undefined,
  refreshToken: string | undefined
) {
  // Determine sandbox status using ENV.
  const useSandbox = process.env.APP_CONFIG !== 'production';

  // Define the API version used by the current codebase.
  const minorVersion = 73;

  // Create the QuickBooks API calls object.
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
