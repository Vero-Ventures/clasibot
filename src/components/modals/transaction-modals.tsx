import { signOut } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { CheckIcon, XIcon } from 'lucide-react';

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
          <div className="mx-4 w-96 rounded-lg bg-white p-4 px-8">
            <>
              <div className="flex items-center justify-center space-x-4 p-2 text-center">
                <h2
                  id="ResultTitle"
                  className="text-center text-3xl font-bold text-red-500">
                  Error
                </h2>
                <div className="flex h-10 w-10 animate-failureAnimation items-center justify-center rounded-full bg-red-500 sm:h-12 sm:w-12">
                  <XIcon className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                </div>
              </div>
              <p
                id="ResultMessage"
                className="mb-4 text-center text-lg font-semibold text-gray-800 mb:text-xl sm:mb-6 sm:mt-2">
                An error occured while loading your classified transactions.
                Refresh the page to try again or contact us if the issue
                persists.
              </p>
            </>
            <div id="ReturnButtonContainer" className="flex justify-center">
              <Button
                id="CloseButton"
                className="0 min-w-32 space-x-4 rounded-md bg-red-500 px-4 py-2 text-xl font-bold hover:bg-red-400 sm:mb-2 sm:min-w-40"
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
          <div className="mx-4 w-96 rounded-lg bg-white p-6 sm:w-[448px]">
            {errorMessage !== '' ? (
              <>
                <div className="flex items-center justify-center space-x-4 p-2 text-center">
                  <h2
                    id="ResultTitle"
                    className="text-center text-3xl font-bold text-red-500">
                    Error
                  </h2>
                  <div className="flex h-10 w-10 animate-failureAnimation items-center justify-center rounded-full bg-red-500 sm:h-12 sm:w-12">
                    <XIcon className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                  </div>
                </div>
                <p
                  id="ResultMessage"
                  className="mb-6 mt-3 text-center text-lg font-semibold text-gray-800 sm:mb-8">
                  {errorMessage}
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center space-x-4 p-2 text-center">
                  <h2
                    id="ResultTitle"
                    className="text-center text-3xl font-bold text-green-500">
                    Success
                  </h2>
                  <div className="flex h-12 w-12 animate-successAnimation items-center justify-center rounded-full bg-green-500">
                    <CheckIcon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <p
                  id="ResultMessage"
                  className="mb-6 mt-3 text-center text-lg font-semibold text-gray-800 sm:mb-8">
                  Transactions have been saved.
                </p>
              </>
            )}

            {/* Define button to return with text based on the error message state. */}
            <div className="flex justify-evenly gap-4">
              <Button
                id="ReturnButton"
                className="text-md transform space-x-4 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 font-semibold text-white shadow-md transition-transform duration-300 ease-in-out hover:scale-105 hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 mb:min-w-32 sm:min-w-40 sm:text-lg"
                onClick={() => {
                  const url = window.location.origin + window.location.pathname;
                  window.location.href = url;
                }}>
                {errorMessage !== '' ? 'Retry Selection' : 'Continue'}
              </Button>

              {/* Define button to finish the session by logging the user out. */}

              <Button
                id="SignOutButton"
                className="text-md transform space-x-4 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 font-semibold text-white shadow-md transition-transform duration-300 ease-in-out hover:scale-105 hover:from-red-600 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 mb:min-w-32 sm:min-w-40 sm:text-lg"
                onClick={() => signOut({ callbackUrl: '/' })}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      }
    </>
  );
};
