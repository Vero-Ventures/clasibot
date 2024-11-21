'use client';

import React, { useState } from 'react';
import { signIn, signOut } from 'next-auth/react';

import { makeCompanyIncactive } from '@/actions/backend-actions/database-functions/index';

import {
  DeactivateInfoModal,
  DeactivateConfirmModal,
  DeactivateErrorModal,
} from '@/components/modals/index';

interface DeactivationButtonProps {
  connectionStatus: boolean;
}

export const DeactivationButton: React.FC<DeactivationButtonProps> = ({
  connectionStatus,
}) => {
  // State trackers to indicate which modals should be displayed to the user.
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);

  // Helper function to allow buttons to switch from info to confirmation modal through single call.
  function openConfirmationModal() {
    setInfoModalOpen(false);
    setConfirmModalOpen(true);
  }

  connectionStatus = false;

  // Deactivate database Company object handler.
  async function deactivateCompany(switchCompany: boolean) {
    // Get the deactivation result and check for an error.
    const deactivationResult = await makeCompanyIncactive();

    if (deactivationResult.result === 'Error') {
      // Close the confirmation modal and open the error modal.
      setConfirmModalOpen(false);
      setErrorModalOpen(true);
    }

    // If the switch Company option was selected, redirect the user to Company selection.
    if (switchCompany) {
      signIn('quickbooks', { callbackUrl: '/home' });
    } else {
      // Otherwise, sign the user out.
      signOut({ callbackUrl: '/' });
    }
  }

  return (
    <>
      {!connectionStatus && (
        <button
          className="flex min-w-52 transform items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-2 py-2 text-white shadow-md transition-transform duration-300 ease-in-out hover:scale-105 hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 md:w-32 md:min-w-32 lg:min-w-52"
          onClick={() => setInfoModalOpen(true)}>
          <span className="text-lg font-semibold">
            Stop <span className="inline-block"> Auto-Review</span>
          </span>
        </button>
      )}

      {
        <DeactivateInfoModal
          displayState={infoModalOpen}
          setDisplayState={setInfoModalOpen}
          switchToInfoModal={openConfirmationModal}></DeactivateInfoModal>
      }

      {
        <DeactivateConfirmModal
          displayState={confirmModalOpen}
          setDisplayState={setConfirmModalOpen}
          deactivateCompany={deactivateCompany}></DeactivateConfirmModal>
      }

      {
        <DeactivateErrorModal
          displayState={errorModalOpen}
          setDisplayState={setErrorModalOpen}></DeactivateErrorModal>
      }
    </>
  );
};
