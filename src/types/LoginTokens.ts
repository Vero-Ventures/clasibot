/**
 * Defines a simple dictionary for the 4 key tokens returned from the synthetic Login process.
 */

export type LoginTokens = {
  // QBO Ticket and Auth Id tokens are pulled from response header cookies.
  qboToken: string;
  authId: string;
  // Access and refresh token are pulled from Session after login.
  accessToken: string;
  refreshToken: string;
};
