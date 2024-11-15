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
  connectionStatus: { connected: boolean; result: string; message: string };
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
      {!connectionStatus.connected && (
        <button
          className="mb-2 flex min-w-52 transform items-center justify-center rounded-lg bg-gradient-to-r from-red-500 to-red-700 px-4 py-3 text-white shadow-md transition-transform duration-300 ease-in-out hover:scale-105 hover:from-red-600 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 lg:w-full lg:min-w-0"
          onClick={() => setInfoModalOpen(true)}>
          <span className="text-lg font-semibold md:text-2xl">
            Deactivate Company
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
