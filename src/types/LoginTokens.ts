/**
 * Defines a dictionary for the tokens returned from the Synthetic Login process.
 */

export type LoginTokens = {
  // Authorization value from network traffic extracted during Synthetic Login.
  intuitApiKey: string;
  // Cookies extracted during Synthetic Login.
  ticket: string;
  agentId: string;
  authId: string;
};
