'use server';
import type { LoginTokens } from '@/types/LoginTokens';
import type { QueryResult } from '@/types/QueryResult';

// Logs into the backend Clasibot app as the synthetic bookkeeper and selects a specific Company.
// Takes: the realm Id and (possibly null) and the Firm name of a Company.
// Returns: A Query Result for the login process and a Login Token object containing the 4 tokens from the login process.
export async function syntheticLogin(
  _realmId: string,
  _firmName: string | null
): Promise<[QueryResult, LoginTokens]> {
  // Synthetic Login Logic (Makes use of realm Id and Firm name in Company selection.)
  //
  //
  //

  const loginResult: QueryResult = {
    result: '',
    message: '',
    detail: '',
  };
  const loginTokens: LoginTokens = {
    qboTicket: '',
    authId: '',
    accessToken: '',
    refreshToken: '',
  };

  return [loginResult, loginTokens];
}
