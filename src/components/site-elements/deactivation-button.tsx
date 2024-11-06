'use client';
import { useState } from 'react';
import { signIn, signOut } from 'next-auth/react';
import { makeCompanyIncactive } from '@/actions/backend-actions/database-functions/bookkeeper-connection';
import { Button } from '@/components/ui/button';

export default function DeactivationButton() {
  // Define states to track the modals for Company deactivation.
  // Tracks the display state of the first Info modal.
  const [openDeactivateCompanyInfoModal, setOpenDeactivateCompanyInfoModal] =
    useState<boolean>(false);
  // Tracks the display state of the second Confirmation modal.
  const [
    openDeactivateCompanyConfirmModal,
    setOpenDeactivateCompanyConfirmModal,
  ] = useState<boolean>(false);
  // Tracks the display state of the possible Error modal.
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
      {/* Button to be replaced.*/}
      <button
        id="DeactivateCompanyButton"
        className="mb-2 flex transform items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-3 text-white shadow-md transition-transform duration-300 ease-in-out hover:scale-105 hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 md:mb-0 md:ml-8 md:mr-8 md:px-4 lg:ml-10 lg:px-8 lg:py-4 xl:px-20"
        onClick={() => setOpenDeactivateCompanyInfoModal(true)}>
        <span id="ButtonText" className="text-lg">
          Deactivate Company
        </span>
      </button>

      {/* Modals to be reviewed and updated in a later step.*/}
      <div className="absolute">
        {/* Defines the information modal to be shown on clicking the deactivate Company button.*/}
        <div
          className={`fixed left-0 top-0 flex h-full w-full items-center justify-center bg-gray-900 bg-opacity-50 ${openDeactivateCompanyInfoModal ? '' : 'hidden'}`}>
          <div className="mx-4 w-96 rounded-lg bg-white p-6">
            <>
              <h2
                id="ResultTitle"
                className="mb-4 text-center text-2xl font-bold text-red-500">
                Deactive Company
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
                className="h-12 w-40 rounded bg-blue-500 px-4 py-4 text-center font-bold text-white hover:bg-blue-600"
                onClick={() => setOpenDeactivateCompanyInfoModal(false)}>
                Cancel
              </Button>
              <Button
                id="ConntinueButton"
                className="h-12 w-40 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
                onClick={() => openDeactivateConfirmationModal()}>
                Continue
              </Button>
            </div>
          </div>
        </div>

        {/* Defines the confirmation modal to be after users continue from Company deactivation modal. */}
        <div
          className={`fixed left-0 top-0 flex h-full w-full items-center justify-center bg-gray-900 bg-opacity-50 ${openDeactivateCompanyConfirmModal ? '' : 'hidden'}`}>
          <div className="mx-4 w-96 rounded-lg bg-white p-6">
            <>
              <h2
                id="ResultTitle"
                className="mb-4 text-center text-2xl font-bold text-green-500">
                Confirm Deactivation
              </h2>
              <p
                id="ResultMessage"
                className="mb-6 text-center font-medium text-gray-800">
                Are you sure you want to deactive the connection to this
                company?
              </p>
            </>
            <div
              id="ReturnButtonContainer"
              className="flex justify-center gap-4">
              <Button
                id="CancelButton"
                className="h-12 w-40 rounded bg-blue-500 px-4 py-4 text-center font-bold text-white hover:bg-blue-600"
                onClick={() => setOpenDeactivateCompanyConfirmModal(false)}>
                Cancel
              </Button>
              {/* Boolean value in deactivation function indicates if the user should be taken to Company selection instead of logged out. */}
              <Button
                id="ConfirmSwitchButton"
                className="h-12 w-40 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
                onClick={() => deactivateCompany(false)}>
                Confirm (Sign Out)
              </Button>
              <Button
                id="ConfirmLogOutButton"
                className="h-12 w-40 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
                onClick={() => deactivateCompany(true)}>
                Confirm (Switch Company)
              </Button>
            </div>
          </div>
        </div>

        {/* Defines the modal to be displayed on if an error occurs during Company deactivation. */}
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
                An error occured while updating the company connection status.
              </p>
            </>
            <div
              id="ReturnButtonContainer"
              className="flex justify-center gap-4">
              <Button
                id="CloseButton"
                className="h-12 w-40 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
                onClick={() => setOpenDeactivateCompanyErrorModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
