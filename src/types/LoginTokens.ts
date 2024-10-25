/**
 * Defines a dictionary for the 4 tokens returned from the synthetic login process.
 */

export type LoginTokens = {
  // QBO Ticket and Auth Id tokens are pulled from response header cookies.
  qboTicket: string;
  authId: string;
  // Access and refresh token are pulled from Session after login.
  accessToken: string;
  refreshToken: string;
};
