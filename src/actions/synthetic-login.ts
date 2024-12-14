'use server';

import type { LoginTokens, QueryResult } from '@/types/index';

// Takes: The realm Id,
// Takes (Invite): Takes the Invite link and a string defining the type of Invite.
// Returns: A Query Result for the login process and the potentially empty Login Tokens.
export async function syntheticLogin(
  realmId: string,
  inviteLink: string = 'null',
  inviteType: string = 'null'
): Promise<[QueryResult, LoginTokens]> {
  // Initialize the Query Result and Login Tokens. Set the Query Result to Error by default.
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
    // Check that Lambda url is defined before calling Synthetic Login Lambda process.
    const lambdaUrl = process.env.SYNTH_AUTH_LAMBDA_URL;
    if (!lambdaUrl) {
      throw new Error('Lambda URL Not Defined');
    }

    // Call the Synthetic Login Lambda handler url and await a response.
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

    // Extract the response data from the Synthetic Login Lambda and check for a success response.
    const data = await response.json();

    if (!response.ok) {
      // If response is not successful, set the detail of the Query Result and return it with the empty Login Tokens.
      loginResult.detail = data.error || 'Unknown Error Occurred';
      return [loginResult, loginTokens];
    }

    // If no invite type was specified, call is for site login and Login Tokens can be extracted.
    if (inviteType === 'null') {
      loginTokens.ticket = data.qboTicket;
      loginTokens.authId = data.authId;
      loginTokens.agentId = data.authId;
    }

    // Set the Query Result as a Success and update the message.
    loginResult.result = 'Success';
    loginResult.message = 'Successfully Completed Synthetic Login Process';
  } catch (error) {
    // Catch any errors and update the Query Result detail based on the error type.
    loginResult.detail =
      error instanceof Error
        ? 'An Error Occurred: ' + error.message
        : 'An Unexpected Error Occurred: ';
  }

  // Return the Query Result and Login Tokens.
  return [loginResult, loginTokens];
}
