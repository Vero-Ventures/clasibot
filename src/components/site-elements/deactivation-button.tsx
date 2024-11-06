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

  // Define states to track the modals for Company deactivation.
  const [openDeactivateCompanyInfoModal, setOpenDeactivateCompanyInfoModal] =
    useState<boolean>(false);
  const [
    openDeactivateCompanyConfirmModal,
    setOpenDeactivateCompanyConfirmModal,
  ] = useState<boolean>(false);
  const [openDeactivateCompanyErrorModal, setOpenDeactivateCompanyErrorModal] =
    useState<boolean>(false);

  // Create helper function to close the deactivate information and open the confirmation modal.
  function openDeactivateConfirmationModal() {
    setOpenDeactivateCompanyInfoModal(false);
    setOpenDeactivateCompanyConfirmModal(true);
  }

  // Define the behavior of confirmation of the Company deactivation.
  async function deactivateCompany(switchCompany: boolean) {
    // Call backend action with the Company realm Id to update Company connection in the database.
    const deactivationResult = await makeCompanyIncactive();

    // Check for an error updating the Company connection.
    if (deactivationResult.result === 'Error') {
      // Close the confirmation modal and open the error modal.
      setOpenDeactivateCompanyConfirmModal(false);
      setOpenDeactivateCompanyErrorModal(true);
    }

    // After Company deactivation, check user continuation method.
    if (switchCompany) {
      // Take the user to Company selection by recalling the QuickBooks sign in method.
      // Already existing QuickBooks session will take them to Company selection.
      signIn('quickbooks', { callbackUrl: '/home' });
    } else {
      // If the user did not choose to switch Company after deactivation, log them out.
      signOut({ callbackUrl: '/' });
    }
  }

  return (
    <>
      {/* Button to open the Deactivate Company modal */}
      {!isInactive && (
        <button
          id="DeactivateCompanyButton"
          className="mb-2 flex transform items-center justify-center rounded bg-gradient-to-r from-red-500 to-red-700 px-2 py-1 text-white shadow-md transition-transform duration-300 ease-in-out hover:scale-105 hover:from-red-600 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75"
          onClick={() => setOpenDeactivateCompanyInfoModal(true)}>
          <span id="ButtonText" className="text-sm">
            Deactivate
          </span>
        </button>
      )}

      {/* Modals */}
      <div className="absolute">
        {/* Information modal */}
        <div
          className={`fixed left-0 top-0 flex h-full w-full items-center justify-center bg-gray-900 bg-opacity-50 ${openDeactivateCompanyInfoModal ? '' : 'hidden'}`}>
          <div className="mx-4 w-96 rounded-lg bg-white p-6">
            <>
              <h2
                id="ResultTitle"
                className="mb-4 text-center text-2xl font-bold text-red-500">
                Deactivate Company
              </h2>
              <p
                id="InfoMessage"
                className="mb-6 text-center font-medium text-gray-800">
                Deactivating your company will cause Clasibot to mark the
                company&apos;s connection as inactive. This will prevent
                Clasibot from accessing your company through QuickBooks online
                and stop any future transaction classification.
              </p>

              <p
                id="InstructionMessage"
                className="mb-6 text-center font-medium text-gray-800">
                When deactivating your company in Clasibot, it is recommended
                that you also remove the Clasibot bookkeeper from the company in
                QuickBooks Online. Clasibot cease accessing your company
                regardless, but doing so will make it easier to reactivate the
                company&apos;s connection in the future.
              </p>

              <p
                id="EndingMessage"
                className="mb-6 text-center font-medium text-gray-800">
                Deactivation can be done at any time without affecting your
                subscription or any other companies you have connected to
                Clasibot. To later reactivate your company, ensure the
                connection has been removed in QuickBooks Online, then follow
                the connection steps shown when logging in.
              </p>
            </>

            <div
              id="ReturnButtonContainer"
              className="flex justify-center gap-4">
              <Button
                id="CancelButton"
                className="h-10 w-32 rounded bg-blue-500 px-4 py-2 text-center font-bold text-white hover:bg-blue-600"
                onClick={() => setOpenDeactivateCompanyInfoModal(false)}>
                Cancel
              </Button>
              <Button
                id="ConntinueButton"
                className="h-10 w-32 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
                onClick={() => openDeactivateConfirmationModal()}>
                Continue
              </Button>
            </div>
          </div>
        </div>

        {/* Confirmation modal */}
        <div
          className={`fixed left-0 top-0 flex h-full w-full items-center justify-center bg-gray-900 bg-opacity-50 ${openDeactivateCompanyConfirmModal ? '' : 'hidden'}`}>
          <div className="w-200l mx-4 max-w-lg rounded-lg bg-white p-6">
            <>
              <h2
                id="ResultTitle"
                className="mb-4 text-center text-2xl font-bold text-green-500">
                Confirm Deactivation
              </h2>
              <p
                id="ResultMessage"
                className="mb-6 text-center font-medium text-gray-800">
                Are you sure you want to deactivate the connection to this
                company?
              </p>
            </>
            <div
              id="ReturnButtonContainer"
              className="flex justify-center gap-4">
              <Button
                id="CancelButton"
                className="h-10 w-32 rounded bg-gray-500 px-4 py-2 text-center font-bold text-white hover:bg-gray-600"
                onClick={() => setOpenDeactivateCompanyConfirmModal(false)}>
                Cancel
              </Button>
              {/* Boolean value in deactivation function indicates if the user should be taken to Company selection instead of logged out. */}
              <Button
                id="ConfirmSwitchButton"
                className="h-10 w-36 rounded bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-600"
                onClick={() => deactivateCompany(false)}>
                Confirm (Sign Out)
              </Button>
              <Button
                id="ConfirmLogOutButton"
                className="h-10 w-36 rounded bg-green-500 px-4 py-2 font-bold text-white hover:bg-green-600"
                onClick={() => deactivateCompany(true)}>
                Confirm (Switch Company)
              </Button>
            </div>
          </div>
        </div>

        {/* Error modal */}
        <div
          className={`fixed left-0 top-0 flex h-full w-full items-center justify-center bg-gray-900 bg-opacity-50 ${openDeactivateCompanyErrorModal ? '' : 'hidden'}`}>
          <div className="mx-4 w-96 rounded-lg bg-white p-6">
            <>
              <h2
                id="ErrorTitle"
                className="mb-4 text-center text-2xl font-bold text-green-500">
                Error
              </h2>
              <p
                id="ErrorMessage"
                className="mb-6 text-center font-medium text-gray-800">
                An error occurred while updating the company connection status.
              </p>
            </>
            <div
              id="ReturnButtonContainer"
              className="flex justify-center gap-4">
              <Button
                id="CloseButton"
                className="h-10 w-32 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
                onClick={() => setOpenDeactivateCompanyErrorModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Export the DeactivationButton component.
export default DeactivationButton;
