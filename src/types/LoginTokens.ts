/**
 * Defines a dictionary for the tokens returned from the synthetic login process.
 */

export type LoginTokens = {
  // Authorization key and cookies that are pulled from headers during synthetic login.
  intuitApiKey: string;
  qboTicket: string;
  agentId: string;
  authId: string;
};
