/**
 * Defines a dictionary for the tokens returned from the Synthetic Login process.
 */

export type LoginTokens = {
  // Authorization key and cookies that are pulled from headers during Synthetic Login.
  intuitApiKey: string;
  ticket: string;
  agentId: string;
  authId: string;
};
