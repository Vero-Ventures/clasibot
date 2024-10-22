import { addAccountingFirmConnection } from '@/actions/backend-functions/database-functions/bookkeeper-connection';

export async function POST(request: Request) {
  try {
    // Get the Authorization header from the request
    const authorizationHeader = request.headers.get('Authorization');

    // Check for the authorization header and return if it is missing or invalid.
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

    // Get the request body that contains the firm name and user name.
    const body = await request.json();

    // Extract the firm name and user name from the request body.
    const firmName: string = body.firmName;
    const userName: string = body.userName;

    // Check if valid firm name and user name were passed.
    // Return an error response if no valid values were passed.
    if (!firmName) {
      console.error(
        'Error Adding Accounting Firm Connection: No Valid Firm Name Passed.'
      );
      return new Response('No Valid Firm Name', { status: 400 });
    }

    if (!userName) {
      console.error(
        'Error Adding Accounting Firm Connection: No Valid User Name Passed.'
      );
      return new Response('No Valid User Name', { status: 400 });
    }

    // Connects the user to a firm that is used is finding and connecting the firms client companies.
    // If no existing matching firm is found- create a new firm and connect it to the user.
    // If existing matches are found, check if the user already belongs to any of them -
    //      If yes, return and continue, otherwise create a new firm and connect it to the user.
    await addAccountingFirmConnection(firmName, userName);

    // Return a success response.
    return new Response('User Successfully Connected To Firm.');
  } catch (error) {
    // Catch any errors, log an identifing message and return an error response.
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
