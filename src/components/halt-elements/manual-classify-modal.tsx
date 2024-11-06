import ProgressBar from '../progress-bar';

interface ManualClassifyModalProps {
  progressMessage: string,
  completedChunks: number;
  maxChunks: number;
}

const ManualClassifyModal = ({
  progressMessage,
  completedChunks,
  maxChunks
}: ManualClassifyModalProps) => {

  return (
    <div
      className={`fixed left-0 top-0 flex h-full w-full items-center justify-center bg-gray-900 bg-opacity-50`}>
      <div className="mx-4 flex w-96 flex-col space-y-4 rounded-lg bg-white p-6">
        <p id="ResultMessage" className="text-center font-medium text-gray-800">
          {progressMessage}
        </p>
        <ProgressBar completedChunks={completedChunks} maxChunks={maxChunks} />
      </div>
    </div>
  );
};

export default ManualClassifyModal;