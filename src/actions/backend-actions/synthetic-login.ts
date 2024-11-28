'use server';

import type { LoginTokens, QueryResult } from '@/types/index';
import { decode } from 'next-auth/jwt';

// Logs into the backend Clasibot app as the synthetic bookkeeper and selects a specific Company.
// Takes: The Company realm Id and (possibly null) and the Firm name of a Company.
//        May also take an invite link and invite type which indicates invite accepting use case.
//        If not passed, values are left as blank which helps with use case checking in lambda.
// Returns: A Query Result for the login process and a Login Token object containing the 4 tokens from the login process.
export async function syntheticLogin(
  realmId: string,
  firmName: string | null,
  inviteLink: string = '',
  inviteType: string = ''
): Promise<[QueryResult, LoginTokens]> {
  // Synthetic Login Logic (Makes use of Company realm Id and Firm name in Company selection.)
  // Initialize the result and token objects
  const loginResult: QueryResult = {
    result: 'error',
    message: 'Failed to complete auth process',
    detail: '',
  };
  const loginTokens: LoginTokens = {
    intuitApiKey: '',
    ticket: '',
    authId: '',
    agentId: '',
  };

  try {
    const lambdaUrl = process.env.SYNTH_AUTH_LAMBDA_URL;
    if (!lambdaUrl) {
      throw new Error('Lambda url environment variable is not defined');
    }

    const response = await fetch(lambdaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        realmId: realmId,
        firmName: firmName,
        inviteLink: inviteLink,
        inviteType: inviteType,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      loginResult.detail = data.error || 'Unknown error occurred';
      return [loginResult, loginTokens];
    }

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      throw new Error('NEXTAUTH_SECRET environment variable is not defined');
    }

    // Decode the session token to extract access and refresh tokens
    const decodedToken = await decode({
      token: data.nextSessionToken,
      secret,
    });

    if (!decodedToken) {
      throw new Error('Failed to decode session token');
    }

    loginTokens.ticket = data.qboTicket;
    loginTokens.authId = data.authId;

    loginResult.result = 'success';
    loginResult.message = 'Successfully completed synthetic auth process';
  } catch (error) {
    loginResult.detail =
      error instanceof Error ? error.message : 'An unexpected error occurred';
  }

  return [loginResult, loginTokens];
}
