'use client';

import React, { useState } from 'react';
import { signIn, signOut } from 'next-auth/react';
import { makeCompanyIncactive } from '@/actions/backend-actions/database-functions/bookkeeper-connection';
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
      {
        <DeactivateInfoModal
          displayState={infoModalOpen}
          setDisplayState={setInfoModalOpen}
          switchToInfoModal={openConfirmationModal}></DeactivateInfoModal>
      }

      {/* Confirmation Modal */}
      {
        <DeactivateConfirmModal
          displayState={confirmModalOpen}
          setDisplayState={setConfirmModalOpen}
          deactivateCompany={deactivateCompany}></DeactivateConfirmModal>
      }

      {/* Error Modal */}
      {
        <DeactivateErrorModal
          displayState={errorModalOpen}
          setDisplayState={setErrorModalOpen}></DeactivateErrorModal>
      }
    </>
  );
};
