import { ProgressBar } from '@/components/loading/index';

import { Button } from '@/components/ui/button';
import { CheckIcon, XIcon } from 'lucide-react';

interface ManualClassifyProgressProps {
  displayState: boolean;
  progressMessage: string;
  completedChunks: number;
  maxChunks: number;
}

export const ManualClassifyProgessModal: React.FC<
  ManualClassifyProgressProps
> = ({
  displayState,
  progressMessage,
  completedChunks,
  maxChunks,
}: ManualClassifyProgressProps) => {
  return (
    <>
      {
        <div
          className={`fixed left-0 top-0 flex h-full w-full items-center justify-center bg-gray-900 bg-opacity-50 ${displayState ? '' : 'hidden'}`}>
          <div className="mx-4 flex w-96 flex-col space-y-4 rounded-lg bg-white p-6 mb:w-[416px] sm:w-[448px]">
            <p className="mt-2 px-2 text-center text-lg font-semibold text-gray-800 mb:text-xl">
              {progressMessage}
            </p>
            {completedChunks < maxChunks && completedChunks >= 0 && (
              <p className="text-center text-base italic text-gray-800 mb:text-lg">
                Working through process {completedChunks + 1} of {maxChunks}
              </p>
            )}
            <ProgressBar
              completedChunks={completedChunks}
              maxChunks={maxChunks}
            />
          </div>
        </div>
      }
    </>
  );
};

interface ManualClassifyCompleteProps {
  displayState: boolean;
  setDisplayState: (newState: boolean) => void;
  manualClassificationState: string;
}

export const ManualClassifyCompleteModal: React.FC<
  ManualClassifyCompleteProps
> = ({
  displayState,
  setDisplayState,
  manualClassificationState,
}: ManualClassifyCompleteProps) => {
  manualClassificationState = 'Error';
  return (
    <>
      {
        <div
          className={`fixed left-0 top-0 flex h-full w-full items-center justify-center bg-gray-900 bg-opacity-50 ${displayState ? '' : 'hidden'}`}>
          <div className="mx-4 w-96 rounded-lg bg-white p-6">
            <>
              <div className="flex items-center justify-center space-x-4 p-2 text-center">
                <h2
                  id="ResultTitle"
                  className={`text-center text-3xl font-bold ${manualClassificationState === 'Error' ? 'text-red-500' : 'text-green-500'} `}>
                  {manualClassificationState === 'Error' ? 'Error' : 'Complete'}
                </h2>
                {manualClassificationState === 'Error' ? (
                  <div className="flex h-10 w-10 animate-failureAnimation items-center justify-center rounded-full bg-red-500 sm:h-12 sm:w-12">
                    <XIcon className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 animate-successAnimation items-center justify-center rounded-full bg-green-500 sm:h-12 sm:w-12">
                    <CheckIcon className="h-6 w-6 text-white sm:h-8 sm:w-8" />
                  </div>
                )}
              </div>
              <p
                id="ResultMessage"
                className="mb-4 mt-2 text-center text-lg font-semibold text-gray-800 sm:mb-6 sm:mt-4">
                {manualClassificationState === 'Error'
                  ? 'An error occured during the classification process. Please try again later or contact us if the issue persists.'
                  : 'Your transactions are classified and ready for review.'}
              </p>
            </>
            <div id="ReturnButtonContainer" className="flex justify-center">
              <Button
                id="CloseButton"
                className="text-md transform space-x-4 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 font-semibold text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 mb:min-w-32 sm:min-w-40 sm:text-lg"
                onClick={() => setDisplayState(false)}>
                {manualClassificationState === 'Error' ? 'Close' : 'Continue'}
              </Button>
            </div>
          </div>
        </div>
      }
    </>
  );
};
