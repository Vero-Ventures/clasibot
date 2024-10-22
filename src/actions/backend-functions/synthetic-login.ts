'use server';
import type { LoginTokens } from '@/types/LoginTokens';
import type { QueryResult } from '@/types/QueryResult';

// Logs into the backend clasibot app as the synthetic bookkeeper and selects a specific company.
// Takes: the realm Id and (possibly null) firm name of a company both used for company selection during login.
// Returns: A Query Result for the login process and a Login Token object containing the 4 tokens from the login process.
export async function syntheticLogin(
  _realmId: string,
  _firmName: string | null
): Promise<[QueryResult, LoginTokens]> {
  // Synthetic Login Logic
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
