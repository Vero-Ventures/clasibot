import { syntheticAuth, syntheticAccept } from './synthetic-login';
import type { APIGatewayProxyEvent } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing request body' }),
      };
    }

    const { realmId, firmName, inviteLink, inviteType } =
      typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

    if (!realmId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'realmId is required' }),
      };
    }

    if (inviteLink === 'null') {
      console.log('Login');
      const tokenData = await syntheticAuth(realmId, firmName);

      return {
        statusCode: 200,
        body: JSON.stringify(tokenData),
      };
    } else {
      await syntheticAccept(inviteLink, inviteType);

      return {
        statusCode: 200,
        body: JSON.stringify({ result: '' }),
      };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};
