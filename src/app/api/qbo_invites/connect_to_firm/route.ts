import { addAccountingFirmConnection } from '@/actions/connection-functions/index';

import { syntheticLogin } from '@/actions/synthetic-login';

export async function POST(request: Request) {
  try {
    // Get request body that contains the Email Monitor auth code and Email data.
    const body = await request.json();

    // Extract the Username, Company name, and invite URL from the request body.
    const firmName: string = body.firmName;
    const userName: string = body.userName;
    const invite_link: string = body.inviteLink;

    // Check for body value that authenticates Email Monitor requests.
    const monitorAuth = body.monitorAuth;

    // If Email Monitor auth is not present, log an eror and return an error response.
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

    // Return an error response if either of the values are missing.
    if (!firmName || !userName) {
      return new Response('Missing Required Value In Body', { status: 400 });
    }

    // Call Synthetic Login to login as Synthetic Bookkeeper and accept the invite.
    const [loginResult, _loginTokens] = await syntheticLogin(
      process.env.BACKEND_REALM_ID!,
      invite_link,
      'firm'
    );

    // If invite accepting resulted in an error, return an error response before connection update.
    if (loginResult.result === 'Error') {
      console.error('Firm Synthetic Invite Accept Failed');
      console.error(loginResult.message);
      console.error(loginResult.detail);
      return new Response('Invite Accept Process Failed', { status: 400 });
    }

    // Call handler to update Firm connection.
    const dbUpdateResult = await addAccountingFirmConnection(
      firmName,
      userName
    );

    if (dbUpdateResult.result === 'Error') {
      console.error('Error Updating Database Firms: ' + dbUpdateResult.detail);
      return new Response('Database Update Process Failed', { status: 400 });
    }

    return new Response('User Successfully Connected To Firm.');
  } catch (error) {
    // Catch any errors and log them (include the error message if it is present) and return an error response.
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
