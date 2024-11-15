'use client';

import React, { useState } from 'react';
import { signIn, signOut } from 'next-auth/react';
import { makeCompanyIncactive } from '@/actions/backend-actions/database-functions/bookkeeper-connection';
import { Button } from '@/components/ui/button';

interface DeactivationButtonProps {
  connectionStatus: { connected: boolean; result: string; message: string };
}

const DeactivationButton: React.FC<DeactivationButtonProps> = ({
  connectionStatus,
}) => {
  // Modal state trackers.
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);

  // Define function to switch from info to confirmation modal.
  function openConfirmationModal() {
    setInfoModalOpen(false);
    setConfirmModalOpen(true);
  }

  // Deactivate database Company object handler.
  async function deactivateCompany(switchCompany: boolean) {
    const deactivationResult = await makeCompanyIncactive();

    if (deactivationResult.result === 'Error') {
      setConfirmModalOpen(false);
      setErrorModalOpen(true);
    }

    if (switchCompany) {
      signIn('quickbooks', { callbackUrl: '/home' });
    } else {
      signOut({ callbackUrl: '/' });
    }
  }

  return (
    <>
      {/* Button to open the Deactivate Company modal */}
      {!connectionStatus.connected && (
        <button
          id="DeactivateCompanyButton"
          className="mb-2 flex min-w-52 transform items-center justify-center rounded-lg bg-gradient-to-r from-red-500 to-red-700 px-4 py-3 text-white shadow-md transition-transform duration-300 ease-in-out hover:scale-105 hover:from-red-600 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 lg:w-full lg:min-w-0"
          onClick={() => setInfoModalOpen(true)}>
          <span id="ButtonText" className="text-lg font-semibold md:text-2xl">
            Deactivate Company
          </span>
        </button>
      )}

      {/* Information Modal */}
      {infoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
          <div className="relative mx-4 max-h-[80%] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-6 shadow-2xl">
            <h2
              id="ResultTitle"
              className="mb-4 text-center text-3xl font-extrabold text-red-600">
              Deactivate Company
            </h2>
            <div className="space-y-4 text-gray-700">
              <p
                id="InfoMessage"
                className="text-center text-lg leading-relaxed">
                Deactivating your company will cause Clasibot to mark the
                company&apos;s connection as inactive. This will prevent
                Clasibot from accessing your company through QuickBooks online
                and stop any future transaction classification.
              </p>

              <p
                id="InstructionMessage"
                className="overflow-hidden text-center text-lg leading-relaxed">
                When deactivating your company in Clasibot, it is recommended
                that you also remove the Clasibot bookkeeper from the company in
                QuickBooks Online. Clasibot cease accessing your company
                regardless, but doing so will make it easier to reactivate the
                company&apos;s connection in the future.
              </p>

              <p
                id="EndingMessage"
                className="text-center text-lg leading-relaxed">
                Deactivation can be done at any time without affecting your
                subscription or any other companies you have connected to
                Clasibot. To later reactivate your company, ensure the
                connection has been removed in QuickBooks Online, then follow
                the connection steps shown when logging in.
              </p>
            </div>
            <div className="mt-6 flex justify-evenly">
              <Button
                id="CancelButton"
                className="text-md min-w-24 space-x-4 rounded-md bg-gray-200 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-300 mb:min-w-32 sm:min-w-40 sm:text-lg"
                onClick={() => setInfoModalOpen(false)}>
                Cancel
              </Button>
              <Button
                id="ConntinueButton"
                className="text-md min-w-24 space-x-4 rounded-md bg-red-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-red-700 mb:min-w-32 sm:min-w-40 sm:text-lg"
                onClick={openConfirmationModal}>
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
            <h2
              id="ResultTitle"
              className="mb-4 text-center text-3xl font-extrabold text-red-600">
              Confirm Deactivation
            </h2>
            <p
              id="ResultMessage"
              className="mb-6 text-center text-lg font-semibold text-gray-700">
              Are you sure you want to deactivate&nbsp;
              <span className="inline-block">
                the connection to this company?
              </span>
            </p>
            <div className="flex flex-col flex-wrap justify-center gap-4">
              <div className="mx-auto mb-4 flex w-fit flex-col gap-4 mb:w-full mb:flex-row mb:justify-evenly mb:gap-6">
                <Button
                  id="ConfirmSwitchButton"
                  className="text-md flex h-fit w-44 flex-col text-wrap rounded-md bg-red-600 px-8 py-2 font-semibold text-white shadow-md hover:bg-red-700"
                  onClick={() => deactivateCompany(false)}>
                  Confirm <span className="inline-block">(Sign Out)</span>
                </Button>
                <Button
                  id="ConfirmLogOutButton"
                  className="text-md flex h-fit w-44 flex-col text-wrap rounded-md bg-red-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-red-700"
                  onClick={() => deactivateCompany(true)}>
                  Confirm <span className="inline-block">(Switch Company)</span>
                </Button>
              </div>
              <Button
                id="CancelButton"
                className="text-md mx-auto w-full max-w-36 rounded-md bg-gray-200 px-6 py-2 font-semibold text-gray-700 hover:bg-gray-300 mb:max-w-48"
                onClick={() => setConfirmModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-96 rounded-2xl bg-white p-4 shadow-2xl">
            <h2
              id="ErrorTitle"
              className="mb-4 text-center text-3xl font-extrabold text-red-600">
              Error
            </h2>
            <p
              id="ErrorMessage"
              className="mb-4 text-center text-lg font-semibold text-gray-700">
              An error occurred while updating&nbsp;
              <span className="block">the company connection status.</span>
            </p>
            <div className="flex justify-center">
              <Button
                id="CloseButton"
                className="rounded-md bg-gray-200 px-12 py-2 text-lg font-semibold text-gray-700 hover:bg-gray-300"
                onClick={() => setErrorModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeactivationButton;
