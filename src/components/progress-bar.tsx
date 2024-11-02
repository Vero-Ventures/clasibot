import React from 'react';
import { CheckIcon } from 'lucide-react'; // Make sure you have lucide-react installed

interface ProgressBarProps {
  progress: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const calculateChunks = (progress: string) => {
    switch (progress) {
      case 'Start Classify':
        return 1;
      case 'Synthetic Login':
        return 2;
      case 'Get For Review Transactions':
        return 3;
      case 'Get Saved Transactions':
        return 4;
      case 'Classify For Review Transactions':
        return 5;
      case 'Create New Classified Transactions':
        return 6;
      case 'Save New Classified Transactions':
        return 7;
      case 'Load New Classified Transactions':
        return 8;
      case 'Classify Complete':
        return 9;
      default:
        return 0;
    }
  };

  const filledChunks = calculateChunks(progress);
  const isCompleted = filledChunks === 9;

  const circleCommonClasses = 'h-4 w-4 rounded-full m-1';

  return (
    <div className="flex items-center justify-center space-x-2 pt-4">
      {isCompleted ? (
        <div className="flex h-12 w-12 animate-successAnimation items-center justify-center rounded-full bg-green-500">
          <CheckIcon className="h-8 w-8 text-white" />
        </div>
      ) : (
        Array.from({ length: 9 }).map((_, index) => (
          <div
            key={index}
            className={`${circleCommonClasses} ${
              index < filledChunks
                ? 'bg-green-500'
                : index === filledChunks
                  ? 'animate-bounce bg-blue-500'
                  : 'bg-gray-300'
            }`}
            style={{
              animationDelay: `${index * 0.1}s`,
              animationDuration: '1s',
            }}
          />
        ))
      )}
    </div>
  );
};

export default ProgressBar;
