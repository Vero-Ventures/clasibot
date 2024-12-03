import { addAccountingFirmCompanies } from '@/actions/connection-functions/index';

export async function POST(request: Request) {
  try {
    // Get request body that contains the Email Monitor auth code and Email data.
    const body = await request.json();

    // Extract the Firm name and Company names from the request body.
    const firmName: string = body.firmName;
    const companyNames: string[] = body.companyNames || [];

    // Check for body value that authenticates Email Monitor requests.
    const monitorAuth = body.monitorAuth;

    console.log(firmName)
    console.log(companyNames)
    console.log(monitorAuth)


    // If Email Monitor auth is not present, log an eror and return an error response.
    if (!monitorAuth || monitorAuth !== process.env.EMAIL_ENDPOINT_AUTH) {
      console.error(
        'Error Adding Company Connection: Missing Or Invalid Authorization Header.'
      );
      return new Response('Missing Or Invalid Authorization Header', {
        status: 401,
      });
    }

    // Check if valid Firm name and Company names were passed and log errors for any missing values.
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

    // Call handler to update Firm Companies connections.
    await addAccountingFirmCompanies(firmName, companyNames);

    return new Response('Firm Companies Connections Successfully Updated.');
  } catch (error) {
    // Catch any errors and log them (include the error message if it is present) and return an error response.
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
