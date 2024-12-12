/**
 * Defines a dictionary for the tokens returned from the Synthetic Login process.
 */

export type LoginTokens = {
  // Authorization value from network traffic extracted during Synthetic Login.
  // Presently static in QBO so not extracted with other tokens (left as empty string).
  intuitApiKey: string;
  // Tokens extracted from cookies during Synthetic Login.
  ticket: string;
  agentId: string;
  authId: string;
};
