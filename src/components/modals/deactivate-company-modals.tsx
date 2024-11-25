'use client';

import React from 'react';

import { Button } from '@/components/ui/button';

interface DeactivateInfoProps {
  displayState: boolean;
  setDisplayState: (displayState: boolean) => void;
  switchToInfoModal: () => void;
}

export const DeactivateInfoModal: React.FC<DeactivateInfoProps> = ({
  displayState,
  setDisplayState,
  switchToInfoModal,
}) => {
  return (
    <>
      {displayState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
          <div className="relative mx-4 max-h-[80%] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-center text-3xl font-extrabold text-red-500 md:text-4xl">
              Remove Company Connection
            </h2>
            <div className="space-y-4 text-gray-700">
              <p className="text-center text-lg leading-relaxed">
                Deactivating your company will cause Clasibot to mark the
                company&apos;s connection as inactive. This will prevent
                Clasibot from accessing your company through QuickBooks online
                and stop any future transaction classification.
              </p>

              <p className="overflow-hidden text-center text-lg leading-relaxed">
                When deactivating your company in Clasibot, it is recommended
                that you also remove the Clasibot bookkeeper from the company in
                QuickBooks Online. Clasibot cease accessing your company
                regardless, but doing so will make it easier to reactivate the
                company&apos;s connection in the future.
              </p>

              <p className="text-center text-lg leading-relaxed">
                Deactivation can be done at any time without affecting your
                subscription or any other companies you have connected to
                Clasibot. To later reactivate your company, ensure the
                connection has been removed in QuickBooks Online, then follow
                the connection steps shown when logging in.
              </p>
            </div>
            <div className="mt-6 flex justify-evenly">
              <Button
                className="min-w-24 space-x-4 rounded-md bg-gray-500 px-4 py-2 text-lg font-semibold text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:bg-gray-600 mb:min-w-32 sm:min-w-40 sm:px-6 sm:py-4 sm:text-xl"
                onClick={() => setDisplayState(false)}>
                Cancel
              </Button>
              <Button
                className="min-w-24 space-x-4 rounded-md bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-lg font-semibold text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 mb:min-w-32 sm:min-w-40 sm:px-6 sm:py-4 sm:text-xl"
                onClick={switchToInfoModal}>
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface DeactivateConfirmProps {
  displayState: boolean;
  setDisplayState: (displayState: boolean) => void;
  deactivateCompany: () => void;
}

export const DeactivateConfirmModal: React.FC<DeactivateConfirmProps> = ({
  displayState,
  setDisplayState,
  deactivateCompany,
}) => {
  return (
    <>
      {displayState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-lg rounded-2xl bg-white p-6 px-4 shadow-2xl mb:p-8">
            <h2 className="mb-4 text-center text-4xl font-extrabold text-red-600 opacity-90">
              Confirm Connection Removal
            </h2>
            <p className="mb-6 text-center text-xl font-semibold text-gray-700">
              Are you sure you want to mark the connection for this company as
              inactive?
            </p>
            <div className="mx-auto flex w-full flex-row justify-evenly mb:gap-6">
              <Button
                className="min-w-28 space-x-4 rounded-md bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-lg font-semibold text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 mb:min-w-32 sm:min-w-40 sm:px-6 sm:py-4 sm:text-xl"
                onClick={() => deactivateCompany()}>
                Confirm
              </Button>
              <Button
                className="min-w-28 space-x-4 rounded-md bg-gray-500 px-4 py-2 text-lg font-semibold text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:bg-gray-600 mb:min-w-32 sm:min-w-40 sm:px-6 sm:py-4 sm:text-xl"
                onClick={() => setDisplayState(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface DeactivateErrorProps {
  displayState: boolean;
  setDisplayState: (displayState: boolean) => void;
}

export const DeactivateErrorModal: React.FC<DeactivateErrorProps> = ({
  displayState,
  setDisplayState,
}) => {
  return (
    <>
      {displayState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-96 rounded-2xl bg-white p-4 shadow-2xl">
            <h2 className="mb-4 mt-2 text-center text-4xl font-extrabold text-red-600">
              Error
            </h2>
            <p className="mb-4 text-center text-lg font-semibold text-gray-700">
              An error occurred while updating the company connection status.
            </p>
            <div className="flex justify-center">
              <Button
                className="min-w-28 space-x-4 rounded-md bg-gray-500 px-4 py-2 text-lg font-semibold text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:bg-gray-600 mb:min-w-32 sm:min-w-40 sm:px-6 sm:py-4 sm:text-xl"
                onClick={() => setDisplayState(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
