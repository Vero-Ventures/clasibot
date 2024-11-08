import ProgressBar from '@/components/progress-bar';
import { Button } from '@/components/ui/button';

interface ManualClassifyProgressProps {
  displayState: boolean;
  progressMessage: string;
  completedChunks: number;
  maxChunks: number;
}

const ManualClassifyProgessModal: React.FC<ManualClassifyProgressProps> = ({
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

const ManualClassifyCompleteModal: React.FC<ManualClassifyCompleteProps> = ({
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
              <h2
                id="ResultTitle"
                className="mb-4 text-center text-2xl font-bold text-green-500">
                {manualClassificationState === 'Error' ? 'Error' : 'Complete'}
              </h2>
              <p
                id="ResultMessage"
                className="mb-6 text-center font-medium text-gray-800">
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
                className="h-12 w-40 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
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

export { ManualClassifyProgessModal, ManualClassifyCompleteModal };
