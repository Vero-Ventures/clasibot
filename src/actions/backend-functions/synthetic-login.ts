'use server';
import type { Session } from 'next-auth/core/types';
import type { QueryResult } from '@/types/QueryResult';

export async function syntheticLogin(
  realmId: string,
  firmName: string | null
): Promise<[QueryResult, string, string, Session]> {
  // Synthetic Login Logic
  //
  //
  //

  let loginResult: QueryResult = {
    result: '',
    message: '',
    detail: '',
  };
  let fetchToken = '';
  let authId = '';
  let syntheticSession: Session = {
    user: {
      name: null,
      email: null,
    },
    expires: '',
  };

  return [loginResult, fetchToken, authId, syntheticSession];
}
