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
            <h2 className="mb-4 text-center text-3xl font-extrabold text-red-600">
              Deactivate Company
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
                className="text-md min-w-24 space-x-4 rounded-md bg-gray-200 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-300 mb:min-w-32 sm:min-w-40 sm:text-lg"
                onClick={() => setDisplayState(false)}>
                Cancel
              </Button>
              <Button
                className="text-md min-w-24 space-x-4 rounded-md bg-red-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-red-700 mb:min-w-32 sm:min-w-40 sm:text-lg"
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
  deactivateCompany: (switchCompany: boolean) => void;
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
          <div className="relative mx-4 w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
            <h2 className="mb-4 text-center text-3xl font-extrabold text-red-600">
              Confirm Deactivation
            </h2>
            <p className="mb-6 text-center text-lg font-semibold text-gray-700">
              Are you sure you want to deactivate&nbsp;
              <span className="inline-block">
                the connection to this company?
              </span>
            </p>
            <div className="flex flex-col flex-wrap justify-center gap-4">
              <div className="mx-auto mb-4 flex w-fit flex-col gap-4 mb:w-full mb:flex-row mb:justify-evenly mb:gap-6">
                <Button
                  className="text-md flex h-fit w-44 flex-col text-wrap rounded-md bg-red-600 px-8 py-2 font-semibold text-white shadow-md hover:bg-red-700"
                  onClick={() => deactivateCompany(false)}>
                  Confirm <span className="inline-block">(Sign Out)</span>
                </Button>
                <Button
                  className="text-md flex h-fit w-44 flex-col text-wrap rounded-md bg-red-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-red-700"
                  onClick={() => deactivateCompany(true)}>
                  Confirm <span className="inline-block">(Switch Company)</span>
                </Button>
              </div>
              <Button
                className="text-md mx-auto w-full max-w-36 rounded-md bg-gray-200 px-6 py-2 font-semibold text-gray-700 hover:bg-gray-300 mb:max-w-48"
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
            <h2 className="mb-4 text-center text-3xl font-extrabold text-red-600">
              Error
            </h2>
            <p className="mb-4 text-center text-lg font-semibold text-gray-700">
              An error occurred while updating&nbsp;
              <span className="block">the company connection status.</span>
            </p>
            <div className="flex justify-center">
              <Button
                className="rounded-md bg-gray-200 px-12 py-2 text-lg font-semibold text-gray-700 hover:bg-gray-300"
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
