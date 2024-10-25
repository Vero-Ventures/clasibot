import { addAccountingFirmConnection } from '@/actions/backend-actions/database-functions/bookkeeper-connection';

export async function POST(request: Request) {
  try {
    // Get the Authorization header from the request.
    const authorizationHeader = request.headers.get('Authorization');

    // Check for an auth header that matches the expeced value, defined by the EMAIL_ENDPOINT_AUTH env.
    if (
      !authorizationHeader ||
      authorizationHeader !== process.env.EMAIL_ENDPOINT_AUTH
    ) {
      console.error(
        'Error Adding Accounting Firm Connection: Missing Or Invalid Authorization Header.'
      );
      return new Response('Missing Or Invalid Authorization Header', {
        status: 401,
      });
    }

    // Get request body that contains the Firm name and user name.
    const body = await request.json();

    // Extract the Firm name and user name from the request body.
    const firmName: string = body.firmName;
    const userName: string = body.userName;

    // Check if valid Firm name and user name were passed.
    // Log error responses for the missing values.
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

    // Call handler for accounting Firm connection emails.
    await addAccountingFirmConnection(firmName, userName);

    // Return a success response.
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
