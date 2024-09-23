'use server';
import { createQBObject } from './qb-client';

export async function queryRequest() {
  const qbo = await createQBObject();

  console.log(qbo.realmId);
  const sqlRequest = `select * from Account where Id > '33'`;
  const encodedSqlRequest = encodeURIComponent(sqlRequest);
  const endpoint = `${qbo.endpoint}${qbo.realmId}/query?query=${encodedSqlRequest}&minorversion=${qbo.minorversion}`;
  console.log(endpoint);
  const decodedEndpoint = decodeURIComponent(endpoint)
  console.log(decodedEndpoint)

  const headers = {
    Accept: 'application/json',
    Authorization: `Intuit_APIKey intuit_apikey=${qbo.consumerKey}`,
  };

  try {
    // Call the query endpoint while passing the auth cookes from the current page.
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: headers,
      credentials: 'include',
    });

    // If no valid response is given, get the response text and return it in a result object with an error result.
    if (!response.ok) {
      const errorText = await response.text();
      return Response.json({
        Result: 'Error',
        Message:
          'Call made to Query API endpoint did not return a valid response.',
        Detail: errorText,
      });
    }

    // Get the response data and return it to the caller in a result object with a success result.
    const responseData = await response.json();
    return Response.json({
      Result: 'success',
      Message:
        'Request made to Query API endpoint was returned a valid response',
      Detail: responseData,
    });
  } catch (error) {
    // If there is an error calling the API, get the response error and return it in a result object with an error result.
    return Response.json({
      Result: 'Error',
      Message: 'Call made to Query API endpoint resulted in error.',
      Detail: error,
    });
  }
}
