'use server';
import { classifyCompany } from './classify-company';
// import type { Session } from 'next-auth/core/types';
import { getServerSession } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';

// Takes a function to update state on front end.
// Returns: A boolean indicating if manual review was successful.
// Integration: Requires synthetic login and state handling on frontend.
export async function manualClassify(
  setManualReviewState: (newState: string) => void
): Promise<boolean> {
  // Make call to synthetic login to get the synthetic session and related tokens.
  //
  //

  const fetchToken = 'null';
  const authId = 'null';
  // Temp usage of get session to be replaced later by synthetic call.
  const session = await getServerSession(options);

  // Only continue if a valid session is found.
  if (session) {
    // Make a call to the company classification method with the retrived values.
    const result = await classifyCompany(
      fetchToken,
      authId,
      session,
      true,
      setManualReviewState
    );

    // Depending on the result of the classification call, update the manual review state and return a success boolean.
    if (result.result === 'Success') {
      setManualReviewState('Classifications Saved.');
      return true;
    } else {
      // Log the errors encountered that resulted in failure.
      console.error('Unexpected Error, Message:' + result.message);
      console.error('Error Details: ' + result.detail);
      setManualReviewState('An Unexpected Error Occured');
      return false;
    }
  } else {
    // Log the errors and update to failure state, then return false for success boolean.
    console.error('Session Not Found.');
    setManualReviewState('An Unexpected Error Occured');
    return false;
  }
}
