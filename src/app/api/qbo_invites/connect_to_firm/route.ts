import { addAccountingFirmConnection } from '@/actions/connection-functions/index';

import { syntheticLogin } from '@/actions/synthetic-login';

export async function POST(request: Request) {
  try {
    // Get request body that contains the Email auth code and Email data.
    const body = await request.json();

    // Extract the Username, Company name, and invite URL from the request body.
    const firmName: string = body.firmName;
    const userName: string = body.userName;
    const invite_link: string = body.inviteLink;

    // Check for body value that authenticates Email monitoring requests.
    const monitorAuth = body.monitorAuth;

    // Check if the Email monitoring auth code is missing or does not match the expected value.
    if (!monitorAuth || monitorAuth !== process.env.EMAIL_ENDPOINT_AUTH) {
      console.error(
        'Error Adding Company Connection: Missing Or Invalid Authorization Header.'
      );
      return new Response('Missing Or Invalid Authorization Header', {
        status: 401,
      });
    }

    // Check if valid Firm name and User name were passed and log errors for any missing values.
    if (!firmName) {
      console.error(
        'Error Adding Accounting Firm Connection: No Valid Firm Name Passed.'
      );
    }
    if (!userName) {
      console.error(
        'Error Adding Accounting Firm Connection: No Valid User Name Passed.'
      );
    }

    // Return an error response if either the Firm or User name values are missing
    if (!firmName || !userName) {
      return new Response('Missing Required Value In Body', { status: 400 });
    }

    // Call Synthetic Login to login as Synthetic Bookkeeper and accept the invite.
    const [loginResult, _loginTokens] = await syntheticLogin(
      process.env.BACKEND_REALM_ID!,
      invite_link,
      'firm'
    );

    // If Synthetic Login resulted in an error, return an error response before connection update.
    if (loginResult.result === 'Error') {
      return new Response('Invite Accept Process Failed', { status: 400 });
    }

    // Call handler to create Firm.
    const dbUpdateResult = await addAccountingFirmConnection(
      firmName,
      userName
    );

    // If the update was successful, return a success response. in
    if (dbUpdateResult.result !== 'Error') {
      return new Response('User Firm Created Successfully.');
    } else {
      // On error updating the clients, log an error and return an error response.
      console.error('Error Updating Database Firms: ' + dbUpdateResult.detail);
      return new Response('Database Update Process Failed', { status: 400 });
    }
  } catch (error) {
    // Catch any errors and log them (include the error message if it is present), then return an error response.
    if (error instanceof Error) {
      console.error(
        'Error Adding Accounting Firm Connection: ' + error.message
      );
    } else {
      console.error('Unexpected Error Accounting Firm Connection.');
    }
    return new Response('Invalid Body Passed', { status: 400 });
  }
}
