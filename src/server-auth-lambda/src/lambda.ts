import { inviteAccept, siteLogin } from './synthetic-login';
import type { APIGatewayProxyEvent } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    // Check for request body and return an error response if it is not found.
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing request body' }),
      };
    }

    // Parse the request body for the realmId and possible invite link and type.
    const { realmId, inviteLink, inviteType } =
      typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

    // If realm Id is not found, return an errors response.
    if (!realmId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing Value: realmId is required.' }),
      };
    }

    // If no invite link is passed, continue with Synthetic site login.
    if (inviteLink === 'null') {
      const tokenData = await siteLogin();

      // If no error is thrown by site login, return the fetched token data as a success response.
      return {
        statusCode: 200,
        body: JSON.stringify(tokenData),
      };
    } else {
      await inviteAccept(inviteLink, inviteType);

      // If no error is thrown by invite accept, return a success response.
      return {
        statusCode: 200,
        body: JSON.stringify({ result: 'Invite Accepted Successfully' }),
      };
    }
  } catch (error) {
    // Catch any errors thrown by called functions.
    // Logs the error and returns it as part of an error response.
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};
