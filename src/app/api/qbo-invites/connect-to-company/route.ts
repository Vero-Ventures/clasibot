import { addCompanyConnection } from '@/actions/backend-functions/database-functions/bookkeeper-connection';

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
        'Error Adding Company Connection: Missing Or Invalid Authorization Header.'
      );
      return new Response('Missing Or Invalid Authorization Header', {
        status: 401,
      });
    }

    // Get the request body that contains the user email name and connected company name.
    const body = await request.json();

    // Extract the user email and company name from the request body.
    const userEmail: string = body.userEmail;
    const companyName: string = body.companyName;

    // Check if valid user email name and company name was passed.
    // Return an error response if no valid values were passed.
    if (!userEmail) {
      console.error(
        'Error Adding Company Connection: No Valid User Email Passed.'
      );
      return new Response('No Valid User Email', { status: 400 });
    }

    if (!companyName) {
      console.error(
        'Error Adding Company Connection: No Valid Company Name Passed.'
      );
      return new Response('No Valid Company Name', { status: 400 });
    }

    // Find the users companies using their email and set the company with the related name to connected.
    await addCompanyConnection(userEmail, companyName);

    // Return a success response.
    return new Response('Company Connection Successfully Updated.');
  } catch (error) {
    // Catch any errors, log an identifing message and return an error response.
    if (error instanceof Error) {
      console.error('Error Adding Company Connection: ' + error.message);
    } else {
      console.error('Unexpected Error Company Connection.');
    }
    return new Response('Invalid Body Passed', { status: 400 });
  }
}
