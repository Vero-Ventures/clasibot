import { addCompanyConnection } from '@/actions/connection-functions/index';

import { syntheticLogin } from '@/actions/synthetic-login';

export async function POST(request: Request) {
  try {
    // Get request body that contains the Email auth code and Email data.
    const body = await request.json();

    // Extract the Username, Company name, and invite URL from the request body.
    const userName: string = body.userName;
    const companyName: string = body.companyName;
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

    // Check if valid User name and Company name were passed and log errors for any missing values.
    if (!userName) {
      console.error(
        'Error Adding Company Connection: No Valid User Email Passed.'
      );
    }

    if (!companyName) {
      console.error(
        'Error Adding Company Connection: No Valid Company Name Passed.'
      );
    }

    // Return an error response if either the User or Company name values are missing
    if (!userName || !companyName) {
      return new Response('Missing Required Value In Body', { status: 400 });
    }

    // Call Synthetic Login to login as Synthetic Bookkeeper and accept the invite.
    const [loginResult, _loginTokens] = await syntheticLogin(
      process.env.BACKEND_REALM_ID!,
      invite_link,
      'company'
    );

    // If Synthetic Login resulted in an error, return an error response before connection update.
    if (loginResult.result === 'Error') {
      return new Response('Invite Accept Process Failed', { status: 400 });
    }

    // Call handler to update Company connection.
    const dbUpdateResult = await addCompanyConnection(userName, companyName);

    // On error updating the clients, log an error and return an error response.
    if (dbUpdateResult.result === 'Error') {
      console.error(
        'Error Updating Database Companies: ' + dbUpdateResult.detail
      );
      return new Response('Database Update Process Failed', { status: 400 });
    } else {
      // If the update was successful, return a success response.
      return new Response('Company Connection Successfully Updated.');
    }
  } catch (error) {
    // Catch any errors and log them (include the error message if it is present), then return an error response.
    if (error instanceof Error) {
      console.error('Error Adding Company Connection: ' + error.message);
    } else {
      console.error('Unexpected Error Company Connection.');
    }
    return new Response('Invalid Body Passed', { status: 400 });
  }
}
