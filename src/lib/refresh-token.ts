import type { TokenSet } from 'next-auth';

// Takes a passed TokenSet object and updates the access token.
export async function refreshToken(token: TokenSet): Promise<TokenSet> {
  // Extract the refresh token from the token object.
  const currentRefreshToken = token?.refreshToken;

  // Define the variables for the QuickBooks client ID and secret.
  let useID;
  let useSecret;

  // Variables are set based on the environment (production or development).
  if (process.env.APP_CONFIG === 'production') {
    useID = process.env.FRONTEND_PROD_CLIENT_ID;
    useSecret = process.env.FRONTEND_PROD_CLIENT_SECRET;
  } else {
    useID = process.env.FRONTEND_DEV_CLIENT_ID;
    useSecret = process.env.FRONTEND_DEV_CLIENT_SECRET;
  }

  const authorizationHeader = `Basic ${Buffer.from(
    `${useID}:${useSecret}`
  ).toString('base64')}`;

  // Define the headers and data send with the request.
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: authorizationHeader,
    Accept: 'application/json',
  };

  const data = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: currentRefreshToken as string,
  });

  try {
    // Define the URL to send the request to.
    const url = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

    // Send the POST request to the Intuit OAuth2 API using the defined url, header, and data.
    const response = await fetch(url, {
      headers,
      method: 'POST',
      body: data,
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw responseData;
    }

    // Return a token object with the new access token, refresh token, and a set expiration time.
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
