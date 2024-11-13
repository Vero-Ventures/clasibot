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
          <div className="mx-4 w-96 rounded-lg bg-white p-6">
            <>
              <div className="mb-2 flex items-center justify-center space-x-4 p-2 text-center">
                <h2
                  id="ResultTitle"
                  className="text-center text-2xl font-bold text-red-500">
                  Error
                </h2>
                <div className="flex h-12 w-12 animate-failureAnimation items-center justify-center rounded-full bg-red-500">
                  <XIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <p
                id="ResultMessage"
                className="mb-6 mt-3 text-center font-medium text-gray-800">
                An error occured while loading your classified transactions.
                Refresh the page to try again or contact us if the issue
                persists.
              </p>
            </>
            <div
              id="ReturnButtonContainer"
              className="flex justify-center gap-4">
              <Button
                id="CloseButton"
                className="text-md min-w-24 space-x-4 rounded-md bg-gray-400 px-4 py-2 font-semibold text-gray-900 hover:bg-gray-500 mb:min-w-32 sm:min-w-40 sm:text-lg"
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
                <div className="flex items-center justify-center space-x-4 p-2 text-center">
                  <h2
                    id="ResultTitle"
                    className="text-center text-2xl font-bold text-red-500">
                    Error
                  </h2>
                  <div className="flex h-12 w-12 animate-failureAnimation items-center justify-center rounded-full bg-red-500">
                    <XIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <p
                  id="ResultMessage"
                  className="mb-6 mt-3 mx-6 text-center font-medium text-gray-800">
                  {errorMessage}
                </p>
              </>
            ) : (
              // If no error is present, display a success message in the modal instead.
              <>
                <div className="flex items-center justify-center space-x-4 p-2 text-center">
                  <h2
                    id="ResultTitle"
                    className="text-center text-2xl font-bold text-green-500">
                    Success
                  </h2>
                  <div className="flex h-12 w-12 animate-successAnimation items-center justify-center rounded-full bg-green-500">
                    <CheckIcon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <p
                  id="ResultMessage"
                  className="mb-6 mt-3 text-center font-medium text-gray-800">
                  Transactions have been saved.
                </p>
              </>
            )}

            {/* Define button to return with text based on the error message state. */}
            <div className="flex justify-evenly">
              <Button
                id="ReturnButton"
                className="text-md space-x-4 rounded-md bg-gray-400 px-4 py-2 font-semibold text-gray-900 hover:bg-gray-500"
                onClick={() => {
                  const url = window.location.origin + window.location.pathname;
                  window.location.href = url;
                }}>
                {errorMessage !== ''
                  ? 'Retry Selection'
                  : 'Continue'}
              </Button>

              {/* Define button to finish the session by logging the user out. */}

              <Button
                id="SignOutButton"
                className="text-md space-x-4 rounded-md bg-gray-400 px-4 py-2 font-semibold text-gray-900 hover:bg-gray-500"
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
