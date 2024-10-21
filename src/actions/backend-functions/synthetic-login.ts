'use server';
import type { Session } from 'next-auth/core/types';
import type { QueryResult } from '@/types/QueryResult';

// Logs into the backend clasibot app as the synthetic bookkeeper and selects a specific company.
// Takes: the realm Id and (possibly null) firm name of a company both used for company selection during login.
// Returns: A Query Result for the login process, the two nessasary cookie values retrived from response headers -
//    And a session logged in as the company related to the passed realm Id.
export async function syntheticLogin(
  _realmId: string,
  _firmName: string | null
): Promise<[QueryResult, string, string, Session]> {
  // Synthetic Login Logic
  //
  //
  //

  const loginResult: QueryResult = {
    result: '',
    message: '',
    detail: '',
  };
  const qboToken = '';
  const authId = '';
  const syntheticSession: Session = {
    user: {
      name: null,
      email: null,
    },
    expires: '',
  };

  return [loginResult, qboToken, authId, syntheticSession];
}
