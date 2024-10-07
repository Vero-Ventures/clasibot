'use server';
import QB from 'node-quickbooks';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import type { Session } from 'next-auth/core/types';

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
    useID = process.env.FRONTEND_PROD_CLIENT_ID;
    useSecret = process.env.FRONTEND_PROD_CLIENT_SECRET;
  } else {
    useID = process.env.FRONTEND_DEV_CLIENT_ID;
    useSecret = process.env.FRONTEND_DEV_CLIENT_SECRET;
  }

  // Define the API version used by the current codebase.
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

// Create a QuickBooks client object.
export async function createQBObjectWithSession(session: Session) {
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
    useID = process.env.BACKEND_PROD_CLIENT_ID;
    useSecret = process.env.BACKEND_PROD_CLIENT_SECRET;
  } else {
    useID = process.env.BACKEND_DEV_CLIENT_ID;
    useSecret = process.env.BACKEND_DEV_CLIENT_SECRET;
  }

  // Define the API version used by the current codebase.
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
