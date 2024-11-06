import React from 'react';
import { CheckIcon } from 'lucide-react'; // Make sure you have lucide-react installed

interface ProgressBarProps {
  completedChunks: number;
  maxChunks: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ completedChunks, maxChunks }) => {

  
  const isCompleted = completedChunks === maxChunks;

  const circleCommonClasses = 'h-4 w-4 rounded-full m-1';

  return (
    <div className="flex items-center justify-center space-x-2 pt-4">
      {isCompleted ? (
        <div className="flex h-12 w-12 animate-successAnimation items-center justify-center rounded-full bg-green-500">
          <CheckIcon className="h-8 w-8 text-white" />
        </div>
      ) : (
        Array.from({ length: maxChunks }).map((_, index) => (
          <div
            key={index}
            className={`${circleCommonClasses} ${
              index < completedChunks
                ? 'bg-green-500'
                : index === completedChunks
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
