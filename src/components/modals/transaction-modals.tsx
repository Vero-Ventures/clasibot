import { signOut } from 'next-auth/react';

import { Button } from '@/components/ui/button';

interface ErrorLoadingTransactionsProps {
  displayState: boolean;
  setDisplayState: (newState: boolean) => void;
}

export const ErrorLoadingTransactionsModal: React.FC<
  ErrorLoadingTransactionsProps
> = ({ displayState, setDisplayState }: ErrorLoadingTransactionsProps) => {
  return (
    <>
      {
        <div
          className={`fixed left-0 top-0 flex h-full w-full items-center justify-center bg-gray-900 bg-opacity-50 ${displayState ? '' : 'hidden'}`}>
          <div className="mx-4 w-96 rounded-lg bg-white p-6">
            <>
              <h2
                id="ResultTitle"
                className="mb-4 text-center text-2xl font-bold text-green-500">
                Error
              </h2>
              <p
                id="ResultMessage"
                className="mb-6 text-center font-medium text-gray-800">
                An error while loading your classified transactions. Refresh the
                page to try again or contact us if the issue persists.
              </p>
            </>
            <div
              id="ReturnButtonContainer"
              className="flex justify-center gap-4">
              <Button
                id="CloseButton"
                className="h-12 w-40 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
                onClick={() => setDisplayState(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      }
    </>
  );
};

interface SaveClassifiedTransactionsProps {
  displayState: boolean;
  errorMessage: string;
}

export const SaveClassifiedTransactionsModal: React.FC<
  SaveClassifiedTransactionsProps
> = ({ displayState, errorMessage }: SaveClassifiedTransactionsProps) => {
  return (
    <>
      {
        <div
          className={`fixed left-0 top-0 flex h-full w-full items-center justify-center bg-gray-900 bg-opacity-50 ${displayState ? '' : 'hidden'}`}>
          <div className="mx-4 w-96 rounded-lg bg-white p-6">
            {/* If an error is present, display an error message in the modal. */}
            {errorMessage !== '' ? (
              <>
                <h2
                  id="ResultTitle"
                  className="mb-4 text-center text-2xl font-bold text-red-500">
                  Error
                </h2>
                <p
                  id="ResultMessage"
                  className="mb-6 text-center font-medium text-gray-800">
                  {errorMessage}
                </p>
              </>
            ) : (
              // If no error is present, display a success message in the modal instead.
              <>
                <h2
                  id="ResultTitle"
                  className="mb-4 text-center text-2xl font-bold text-green-500">
                  Success
                </h2>
                <p
                  id="ResultMessage"
                  className="mb-6 text-center font-medium text-gray-800">
                  Transactions have been saved.
                </p>
              </>
            )}

            {/* Define button to return with text based on the error message state. */}
            <div
              id="ReturnButtonContainer"
              className="flex justify-center gap-4">
              <Button
                id="ReturnButton"
                className="h-12 w-40 rounded bg-blue-500 px-4 py-4 text-center font-bold text-white hover:bg-blue-600"
                onClick={() => {
                  const url = window.location.origin + window.location.pathname;
                  window.location.href = url;
                }}>
                <span className="whitespace-normal">
                  {errorMessage !== ''
                    ? 'Retry Transaction Selection'
                    : 'Review Additional Transactions'}
                </span>
              </Button>
              {/* Define button to finish the session by logging the user out. */}
              <Button
                id="SignOutButton"
                className="h-12 w-40 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
                onClick={() => signOut({ callbackUrl: '/' })}>
                Finish Review Session
              </Button>
            </div>
          </div>
        </div>
      }
    </>
  );
};
