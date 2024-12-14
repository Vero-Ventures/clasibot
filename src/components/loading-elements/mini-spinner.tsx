'use client';

import { CheckIcon, XIcon } from 'lucide-react';

import { useEffect, useState } from 'react';

interface MiniSpinnerProps {
  success: boolean | null;
}

// Takes: A nullable boolean indicating loading, success, or error.
export const MiniSpinner = ({ success }: MiniSpinnerProps) => {
  // Define state to track if the loading animation is shown or the success / error icons.
  const [animationState, setAnimationState] = useState('loading');

  // Based on success value update the animation state.
  // Null: loading, True: success, False: error.
  useEffect(() => {
    if (success === true) {
      setAnimationState('success');
    } else if (success === false) {
      setAnimationState('failure');
    }
  }, [success]);

  // Common formatting for the circles to be animated.
  const circleCommonClasses = 'h-3 w-3 bg-blue-500 rounded-full m-1';

  return (
    <div
      id="SpinnerContainer"
      className="flex items-center justify-center pt-4">
      {animationState === 'loading' && (
        <>
          <div
            id="SpinnerCircle1"
            className={`${circleCommonClasses} animate-bounce`}
            style={{ animationDelay: '0s', animationDuration: '1s' }}></div>

          <div
            id="SpinnerCircle2"
            className={`${circleCommonClasses} animate-bounce`}
            style={{ animationDelay: '0.1s', animationDuration: '1s' }}></div>

          <div
            id="SpinnerCircle3"
            className={`${circleCommonClasses} animate-bounce`}
            style={{ animationDelay: '0.2s', animationDuration: '1s' }}></div>

          <div
            id="SpinnerCircle4"
            className={`${circleCommonClasses} animate-bounce`}
            style={{ animationDelay: '0.3s', animationDuration: '1s' }}></div>
        </>
      )}

      {animationState === 'success' && (
        <div
          id="SuccessCircle"
          className="flex h-10 w-10 animate-successAnimation items-center justify-center rounded-full bg-green-500">
          <CheckIcon className="h-6 w-6 text-white" />
        </div>
      )}

      {animationState === 'failure' && (
        <div
          id="FailureCircle"
          className="flex h-10 w-10 animate-failureAnimation items-center justify-center rounded-full bg-red-500">
          <XIcon className="h-6 w-6 text-white" />
        </div>
      )}
    </div>
  );
};
