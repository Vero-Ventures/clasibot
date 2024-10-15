'use server';
import { classifyCompany } from './classify-company';
import type { Session } from 'next-auth/core/types';

export async function manualClassify(
  setManualReviewState: (newState: string) => void
): Promise<boolean> {
  // Make some call to synthetic login to get the session and related tokens.
  const fetchToken = null;
  const authId = null;
  const session = null;

  // Make a call to the company classification method with the retrived values.
  const result = await classifyCompany(
    fetchToken,
    authId,
    session,
    true,
    setManualReviewState
  );

  if (result.result === 'Success') {
    setManualReviewState('Classifications Saved.');
    return true;
  } else {
    console.error('Unexpected Error, Message:' + result.message);
    console.error('Error Details: ' + result.detail);
    setManualReviewState('An Unexpected Error Occured');
    return false;
  }
}
