import { addAccountingFirmCompanies } from '@/actions/backend-functions/database-functions/bookkeeper-connection';

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
        'Error Adding Accounting Firm Companies: Missing Or Invalid Authorization Header.'
      );
      return new Response('Missing Or Invalid Authorization Header', {
        status: 401,
      });
    }

    // Get request body that contains the firm name and company names.
    const body = await request.json();

    // Extract the firm name and company names from the request body.
    const firmName: string = body.firmName;
    const companyNames: string[] = body.companies || [];

    // Check if valid firm name and company names were passed.
    // Log error responses for the missing values.
    if (!firmName) {
      console.error(
        'Error Adding Accounting Firm Companies: No Valid Firm Name Passed.'
      );
    }
    if (!companyNames.length) {
      console.error(
        'Error Adding Accounting Firm Companies: No Valid Company Names Passed.'
      );
    }

    // Return an error response if either of the values are missing.
    if (!firmName || !companyNames.length) {
      return new Response('Missing Required Value In Body', { status: 400 });
    }

    // Call handler for accounting firm client access emails.
    await addAccountingFirmCompanies(firmName, companyNames);

    // Return a success response.
    return new Response('Firm Companies Connections Successfully Updated.');
  } catch (error) {
    // Catch any errors, log an identifing message and return an error response.
    if (error instanceof Error) {
      console.error(
        'Error Adding Accounting Firm Client Companies: ' + error.message
      );
    } else {
      console.error('Unexpected Error Adding Accounting Firm Client Companies');
    }
    return new Response('Invalid Body Passed', { status: 400 });
  }
}
