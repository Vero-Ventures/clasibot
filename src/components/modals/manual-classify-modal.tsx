'use client';
import { useState, useEffect } from 'react';
import ProgressBar from '@/components/progress-bar';

interface ManualClassifyModalProps {
  _progressMessage: string;
  _completedChunks: number;
  maxChunks: number;
}

const ManualClassifyModal = ({
  _progressMessage,
  _completedChunks,
  maxChunks, // Completion state that hide the modal after a brief delay.
}: ManualClassifyModalProps) => {
  const [testProgressMessage, setTestProgressMessage] =
    useState<string>('Start Classify');

  const [testCompletedChunks, setTestCompletedChunks] = useState<number>(0);

  function test() {
    const manualClassificationStates = [
      'Start Classify',
      'Synthetic Login',
      'Get For Review Transactions',
      'Get Saved Transactions',
      'Classify For Review Transactions',
      'Create New Classified Transactions',
      'Save New Classified Transactions',
      'Load New Classified Transactions',
      // Set last step to 'Error' to test error
      'Classify Complete',
    ];

    let index = 1;

    setInterval(() => {
      setTestCompletedChunks(index);
      setTestProgressMessage(manualClassificationStates[index]);
      index++;
    }, 2000);
  }

  useEffect(() => {
    test();
  }, []);

  return (
    <div
      className={`fixed left-0 top-0 flex h-full w-full items-center justify-center bg-gray-900 bg-opacity-50`}>
      <div className="mx-4 flex w-96 flex-col space-y-4 rounded-lg bg-white p-6">
        <p
          id="ResultMessage"
          className="text-center text-base font-medium text-gray-800">
          {testProgressMessage}
        </p>
        {testCompletedChunks < maxChunks && testCompletedChunks >= 0 && (
          <p className="text-center text-sm text-gray-800">
            Working through process {testCompletedChunks + 1} of {maxChunks}...
          </p>
        )}
        <ProgressBar
          completedChunks={testCompletedChunks}
          maxChunks={maxChunks}
        />
      </div>
    </div>
  );
};

export default ManualClassifyModal;
