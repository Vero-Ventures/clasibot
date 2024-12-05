'use server';

import type { LoginTokens, QueryResult } from '@/types/index';

// Logs into the backend Clasibot app as the Synthetic Bookkeeper.
// Handles both login for getting 'For Review' transactions and for accepting Invites.
// Takes: The Company realm Id -
// Takes (Transactions): Takes a name of a Firm that contains the Company (set to empty if not needed).
// Takes (Invite): Takes the Invite link and a string defining the type of Invite (set to empty string for transactions).
// Returns: A Query Result for the login process and a potentially empty Login Tokens object.
export async function syntheticLogin(
  realmId: string,
  inviteLink: string = 'null',
  inviteType: string = 'null'
): Promise<[QueryResult, LoginTokens]> {
  // Initialize the Query Result and Login Tokens objects. Sets Query Result to Error by default.
  const loginResult: QueryResult = {
    result: 'Error',
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
    // Check that lambda url is defined before calling Synthetic Login lambda process.
    const lambdaUrl = process.env.SYNTH_AUTH_LAMBDA_URL;
    if (!lambdaUrl) {
      throw new Error('Lambda url environment variable is not defined');
    }

    // Call the Synthetic Login Lambda handler and await a response.
    const response = await fetch(lambdaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        realmId: realmId,
        inviteLink: inviteLink,
        inviteType: inviteType,
      }),
    });

    // Extract the response data and check for a successful response.
    const data = await response.json();

    if (!response.ok) {
      // If response was not successful, set the detail of the Query Result and return it alongside the empty Login Tokens.
      loginResult.detail = data.error || 'Unknown error occurred';
      return [loginResult, loginTokens];
    }

    // If no invite type was specified, call is for Transactions and Login Tokens can be extracted from returned data.
    if (inviteType === 'null') {
      loginTokens.ticket = data.qboTicket;
      loginTokens.authId = data.authId;
      loginTokens.agentId = data.authId;
    }

    // Set the Query Result to Success and update the message.
    loginResult.result = 'Success';
    loginResult.message = 'Successfully completed synthetic auth process';
  } catch (error) {
    // Catch any errors and update the Query Result detail based on the error type.
    loginResult.detail =
      error instanceof Error ? error.message : 'An unexpected error occurred';
  }

  // Return the Query Result and Login Tokens objects.
  return [loginResult, loginTokens];
}
