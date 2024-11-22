import { addCompanyConnection } from '@/actions/backend-actions/database-functions/index';

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
        'Error Adding Company Connection: Missing Or Invalid Authorization Header.'
      );
      return new Response('Missing Or Invalid Authorization Header', {
        status: 401,
      });
    }

    // Get request body that contains the User email name and connected Company name.
    const body = await request.json();

    // Extract the User email and Company name from the request body.
    const userEmail: string = body.userEmail;
    const companyName: string = body.companyName;
    const _invite_link: string = body.inviteLink;

    // Check if valid User email name and Company name was passed.
    // Log error responses for the missing values.
    if (!userEmail) {
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
    if (!userEmail || !companyName) {
      return new Response('Missing Required Value In Body', { status: 400 });
    }

    // Call handler for Company accountant invite emails.
    await addCompanyConnection(userEmail, companyName);

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
