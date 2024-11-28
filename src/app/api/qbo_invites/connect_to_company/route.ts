import { addCompanyConnection } from '@/actions/connection-functions/index';

import { syntheticLogin } from '@/actions/synthetic-login';

export async function POST(request: Request) {
  try {
    // Get request body that contains the email monitor auth code and email data.
    const body = await request.json();

    // Check for body value that authenticates email monitor requests.
    const monitorAuth = body.monitorAuth;

    // Extract the Username, Company name, and invite URL from the request body.
    const userName: string = body.userName;
    const companyName: string = body.companyName;
    const invite_link: string = body.inviteLink;

    console.log(body)

    // Check for an auth header that matches the expeced value, defined by the EMAIL_ENDPOINT_AUTH env.
    if (!monitorAuth || monitorAuth !== process.env.EMAIL_ENDPOINT_AUTH) {
      console.error(
        'Error Adding Company Connection: Missing Or Invalid Authorization Header.'
      );
      return new Response('Missing Or Invalid Authorization Header', {
        status: 401,
      });
    }

    // Check if valid User email name and Company name was passed.
    // Log error responses for the missing values.
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

    // Return an error response if either of the values are missing.
    if (!userName || !companyName) {
      return new Response('Missing Required Value In Body', { status: 400 });
    }

    // Call Synthetic Login to login as Synthetic Bookkeeper and accept the invite.
    const [loginResult, _loginTokens] = await syntheticLogin(
      process.env.BACKEND_REALM_ID!,
      null,
      invite_link,
      'company'
    );

    if (loginResult.result === 'Error') {
      console.log('Invite Accept Error')
      console.log(loginResult.message)
      console.log(loginResult.detail)
      return new Response('Invite Accept Process Failed', { status: 400 });
    }

    // Call handler to update Company connection.
    await addCompanyConnection(userName, companyName);

    // Return a success response.
    return new Response('Company Connection Successfully Updated.');
  } catch (error) {
    // Catch any errors and log them (include the error message if it is present) and return an error response.
    if (error instanceof Error) {
      console.error('Error Adding Company Connection: ' + error.message);
    } else {
      console.error('Unexpected Error Company Connection.');
    }
    return new Response('Invalid Body Passed', { status: 400 });
  }
}
