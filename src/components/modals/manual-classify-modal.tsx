import ProgressBar from '@/components/progress-bar';

interface ManualClassifyModalProps {
  progressMessage: string;
  completedChunks: number;
  maxChunks: number;
}

const ManualClassifyModal = ({
  progressMessage,
  completedChunks,
  maxChunks, // Completion state that hide the modal after a brief delay.
}: ManualClassifyModalProps) => {
  return (
    <div
      className={`fixed left-0 top-0 flex h-full w-full items-center justify-center bg-gray-900 bg-opacity-50`}>
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
        <ProgressBar completedChunks={completedChunks} maxChunks={maxChunks} />
      </div>
    </div>
  );
};

export default ManualClassifyModal;
