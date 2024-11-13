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
          <div className="mx-4 flex w-96 flex-col space-y-4 rounded-lg bg-white p-6">
            <p
              id="ResultMessage"
              className="text-center text-lg font-medium text-gray-800 sm:text-xl">
              {progressMessage}
            </p>
            {completedChunks < maxChunks && completedChunks >= 0 && (
              <p className="text-md text-center italic text-gray-800">
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
                  className={`text-center text-2xl font-bold ${manualClassificationState === 'Error' ? 'text-red-500' : 'text-green-500'} `}>
                  {manualClassificationState === 'Error' ? 'Error' : 'Complete'}
                </h2>
                {manualClassificationState === 'Error' ? (
                  <div className="flex h-12 w-12 animate-failureAnimation items-center justify-center rounded-full bg-red-500">
                    <XIcon className="h-6 w-6 text-white" />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 animate-successAnimation items-center justify-center rounded-full bg-green-500">
                    <CheckIcon className="h-8 w-8 text-white" />
                  </div>
                )}
              </div>
              <p
                id="ResultMessage"
                className="mx-6 mb-6 mt-3 text-center font-medium text-gray-800">
                {manualClassificationState === 'Error'
                  ? 'An error occured during the classification process. Please try again later or contact us if the issue persists.'
                  : 'Your transactions are classified and ready for review.'}
              </p>
            </>
            <div
              id="ReturnButtonContainer"
              className="flex justify-center gap-4">
              <Button
                id="CloseButton"
                className="text-md space-x-4 rounded-md bg-gray-400 px-4 py-2 font-semibold text-gray-900 hover:bg-gray-500"
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
