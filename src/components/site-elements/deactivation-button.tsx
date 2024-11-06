'use client';

import React, { useState } from 'react';
import { signIn, signOut } from 'next-auth/react';
import { makeCompanyIncactive } from '@/actions/backend-actions/database-functions/bookkeeper-connection';
import { Button } from '@/components/ui/button';

interface DeactivationButtonProps {
  status: string;
}

const DeactivationButton: React.FC<DeactivationButtonProps> = ({ status }) => {
  const isInactive = status === 'Inactive';

  // Modal state management
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);

  // Open confirmation modal
  function openConfirmationModal() {
    setInfoModalOpen(false);
    setConfirmModalOpen(true);
  }

  // Deactivate company function
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
      {!isInactive && (
        <button
          id="DeactivateCompanyButton"
          className="flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-white shadow-lg transition-transform duration-200 hover:scale-105 hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300"
          onClick={() => setInfoModalOpen(true)}>
          <span className="text-sm font-medium">Deactivate</span>
        </button>
      )}

      {/* Information Modal */}
      {infoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl">
            <h2
              id="ResultTitle"
              className="mb-6 text-center text-3xl font-extrabold text-red-600">
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
                className="text-center text-lg leading-relaxed">
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
            <div className="mt-8 flex justify-end space-x-4">
              <Button
                id="CancelButton"
                className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
                onClick={() => setInfoModalOpen(false)}>
                Cancel
              </Button>
              <Button
                id="ConntinueButton"
                className="rounded-md bg-red-600 px-4 py-2 text-white shadow-md hover:bg-red-700"
                onClick={openConfirmationModal}>
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
            <h2
              id="ResultTitle"
              className="mb-6 text-center text-3xl font-extrabold text-red-600">
              Confirm Deactivation
            </h2>
            <p
              id="ResultMessage"
              className="mb-8 text-center text-lg text-gray-700">
              Are you sure you want to deactivate the connection to this
              company?
            </p>
            <div className="flex flex-row flex-wrap justify-center gap-4">
              <Button
                id="CancelButton"
                className="w-full max-w-xs rounded-md bg-gray-200 px-6 py-2 text-gray-700 hover:bg-gray-300"
                onClick={() => setConfirmModalOpen(false)}>
                Cancel
              </Button>
              <Button
                id="ConfirmSwitchButton"
                className="w-full max-w-xs rounded-md bg-red-600 px-6 py-2 text-white shadow-md hover:bg-red-700"
                onClick={() => deactivateCompany(false)}>
                Confirm (Sign Out)
              </Button>
              <Button
                id="ConfirmLogOutButton"
                className="w-full max-w-xs rounded-md bg-red-600 px-6 py-2 text-white shadow-md hover:bg-red-700"
                onClick={() => deactivateCompany(true)}>
                Confirm (Switch Company)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <h2
              id="ErrorTitle"
              className="mb-6 text-center text-3xl font-extrabold text-red-600">
              Error
            </h2>
            <p
              id="ErrorMessage"
              className="mb-8 text-center text-lg text-gray-700">
              An error occurred while updating the company connection status.
            </p>
            <div className="flex justify-end">
              <Button
                id="CloseButton"
                className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
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
