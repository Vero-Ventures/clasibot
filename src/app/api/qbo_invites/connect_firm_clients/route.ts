import { changeAccountingFirmCompanyAccess } from '@/actions/connection-functions/index';

export async function POST(request: Request) {
  try {
    // Get request body that contains the Email auth code and Email data.
    const body = await request.json();

    // Extract the Firm name and Company names from the request body.
    const firmName: string = body.firmName;
    const companyNames: string[] = body.companyNames || [];
    const changeType: string = body.changeType || [];

    // Check for body value that authenticates Email monitoring requests.
    const monitorAuth = body.monitorAuth;

    // Check if the Email monitoring auth code is missing or does not match the expected value.
    if (!monitorAuth || monitorAuth !== process.env.EMAIL_ENDPOINT_AUTH) {
      // Log an error and return an error response.
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

    // Return an error response if either the Firm or Company name values are missing.
    if (!firmName || !companyNames.length) {
      return new Response('Missing Required Value In Body', { status: 400 });
    }

    // Call handler to update Connections for the Firm client Companies.
    const dbUpdateResult = await changeAccountingFirmCompanyAccess(
      firmName,
      companyNames,
      changeType === 'added'
    );

    // On error updating the clients, log an error and return an error response.
    if (dbUpdateResult.result === 'Error') {
      console.error(
        'Error Updating Database Firm Clients: ' + dbUpdateResult.detail
      );
      return new Response('Database Update Process Failed', { status: 400 });
    } else {
      // If the update was successful, return a success response.
      return new Response('Firm Companies Connections Successfully Updated.');
    }
  } catch (error) {
    // Catch any errors and log them (include the error message if it is present), then return an error response.
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
