/**
 * This file contains a function that refreshes the access token using the refresh token.
 */
import type { TokenSet } from 'next-auth';

// Takes a passed TokenSet object.
export async function refreshToken(token: TokenSet): Promise<TokenSet> {
  // Extract the refresh token from the token object.
  const currentRefreshToken = token?.refreshToken;

  // Define the variables for the QuickBooks client ID and secret.
  let useID;
  let useSecret;

  // Set the QuickBooks client ID and secret based on the environment.
  if (process.env.APP_CONFIG === 'production') {
    useID = process.env.PROD_CLIENT_ID;
    useSecret = process.env.PROD_CLIENT_SECRET;
  } else {
    useID = process.env.DEV_CLIENT_ID;
    useSecret = process.env.DEV_CLIENT_SECRET;
  }

  // Define the authorization header using client ID and secret.
  const authorization = `Basic ${Buffer.from(`${useID}:${useSecret}`).toString(
    'base64'
  )}`;

  // Define the URL to send the request to.
  const url = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

  // Define the headers to send with the request.
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: authorization,
    Accept: 'application/json',
  };

  // Define the data to send in the request.
  const data = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: currentRefreshToken as string,
  });

  try {
    // Send the POST request to the Intuit OAuth2 API using the defined header and data.
    const response = await fetch(url, {
      headers,
      method: 'POST',
      body: data,
    });

    // Parse the response as JSON.
    const responseData = await response.json();

    // If the response is not OK, throw the response data.
    if (!response.ok) {
      throw responseData;
    }

    // Return a new token object with the new access token, refresh token, and expiration time.
    return {
      ...token,
      accessToken: responseData.access_token,
      refreshToken: responseData.refresh_token,
      expiresAt: Date.now() / 1000 + responseData.expires_in,
    } as TokenSet;
  } catch (error) {
    // Log the error and return the original token object.
    console.error('Error refreshing token:', error);
    return token;
  }
}
