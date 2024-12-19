'use client';

import React from 'react';

import { useState } from 'react';

import { undoForReviewSave } from '@/actions/quickbooks/for-review/undo-for-review';

import { MiniSpinner } from '@/components/loading-elements/index';

import { Button } from '@/components/ui/index';

interface UndoSaveModalProps {
  displayState: boolean;
  setDisplayState: (displayState: boolean) => void;
}

// Takes: The modal display state and its setter as well as the deactivate Company handler.
export const UndoSaveModal: React.FC<UndoSaveModalProps> = ({
  displayState,
  setDisplayState,
}) => {
  // Define state to determine if the buttons or loading element are shown.
  const [showLoadingAnimation, setShowLoadingAnimation] =
    useState<boolean>(false);

  // Define undo save result state for loading element.
  const [undoSaveResult, setUndoSaveResult] = useState<boolean | null>(null);

  // Define function to switch to a loading element when confirm is clicked.
  async function handleUndoSave() {
    // Set the loading animation to be shown and call the undo save function.
    setShowLoadingAnimation(true);
    const undoSaveReponse = await undoForReviewSave();

    // Check the result and set the result state accordingly to update the Mini Spinner.
    if (undoSaveReponse.result === 'Error') {
      setUndoSaveResult(false);
    } else {
      setUndoSaveResult(true);
    }

    // After animation is updated, wait two seconds then refresh the page to re-load the 'For Review' transactions.
    setTimeout(() => {
      location.reload();
    }, 2000);
  }

  return (
    <>
      {displayState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-lg rounded-2xl bg-white p-6 px-4 shadow-2xl mb:p-8">
            <h2 className="mb-4 text-center text-4xl font-extrabold text-red-600 opacity-90">
              Confirm Undo Last Save
            </h2>
            <p className="mb-6 text-center text-xl font-semibold text-gray-700">
              Are you sure you want to undo the last save. The transactions will
              be removed from the categorized section on QuickBooks.
            </p>
            {!showLoadingAnimation ? (
              <div className="mx-auto flex w-full flex-row justify-evenly mb:gap-6">
                <Button
                  className="min-w-28 space-x-4 rounded-md bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-lg font-semibold text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 mb:min-w-32 sm:min-w-40 sm:px-6 sm:py-4 sm:text-xl"
                  onClick={() => handleUndoSave()}>
                  Confirm
                </Button>
                <Button
                  className="min-w-28 space-x-4 rounded-md bg-gray-500 px-4 py-2 text-lg font-semibold text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:bg-gray-600 mb:min-w-32 sm:min-w-40 sm:px-6 sm:py-4 sm:text-xl"
                  onClick={() => setDisplayState(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <MiniSpinner success={undoSaveResult} />
            )}
          </div>
        </div>
      )}
    </>
  );
};
