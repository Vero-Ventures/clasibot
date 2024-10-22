import { addAccountingFirmCompanies } from '@/actions/backend-functions/database-functions/bookkeeper-connection';

export async function POST(request: Request) {
  try {
    // Get the request body that contains the firm name and newly connected companies.
    const body = await request.json();

    // Extract the firm name and company names from the request body.
    const firmName: string = body.firmName;
    const companyNames: string[] = body.companies || [];

    // Check if valid firm name and company names were passed.
    // Return an error response if no valid values were passed.
    if (!firmName) {
      console.error(
        'Error Adding Accounting Firm Companies: No Valid Firm Name Passed.'
      );
      return new Response('No Valid Firm Name', { status: 400 });
    }

    if (!companyNames.length) {
      console.error(
        'Error Adding Accounting Firm Companies: No Valid Company Names Passed.'
      );
      return new Response('No Valid Company Names', { status: 400 });
    }

    // If valid values were passed, update the connections of the passed companies.
    // Finds related firm in database and updates the related companies using array of passed company names.
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
