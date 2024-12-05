'use client';

import React from 'react';
import { signOut } from 'next-auth/react';

import { makeCompanyIncactive } from '@/actions/connection-functions/index';

import {
  DeactivateInfoModal,
  DeactivateConfirmModal,
  DeactivateErrorModal,
} from '@/components/modals/index';

interface DeactivationButtonProps {
  setShowModal: (newState: boolean) => void;
  connectionStatus: boolean;
  infoModalOpen: boolean;
  confirmModalOpen: boolean;
  errorModalOpen: boolean;
  setInfoModalOpen: (newState: boolean) => void;
  setConfirmModalOpen: (newState: boolean) => void;
  setErrorModalOpen: (newState: boolean) => void;
}

export const DeactivationButton: React.FC<DeactivationButtonProps> = ({
  setShowModal,
  connectionStatus,
  infoModalOpen,
  confirmModalOpen,
  errorModalOpen,
  setInfoModalOpen,
  setConfirmModalOpen,
  setErrorModalOpen,
}) => {
  // Helper function to close the modals and the info modal to closed as well.
  function hideModals(hideState: boolean) {
    setShowModal(hideState);
    setInfoModalOpen(hideState);
    setConfirmModalOpen(hideState);
    setErrorModalOpen(hideState);
  }

  // Helper function to allow buttons to switch from info to confirmation modal through single call.
  function openConfirmationModal() {
    setInfoModalOpen(false);
    setConfirmModalOpen(true);
  }

  // Deactivate database Company object handler.
  async function deactivateCompany() {
    // Get the deactivation result and check for an error.
    const deactivationResult = await makeCompanyIncactive();

    if (deactivationResult.result === 'Error') {
      // Close the confirmation modal and open the error modal.
      setConfirmModalOpen(false);
      setErrorModalOpen(true);
    } else {
      // If no error occured, sign the user out.
      signOut({ callbackUrl: '/' });
    }
  }

  return (
    <>
      {
        <button
          className="flex min-w-52 transform items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-2 py-2 text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 md:w-32 md:min-w-32 lg:min-w-52"
          disabled={!connectionStatus}
          onClick={() => {
            setShowModal(true);
            setInfoModalOpen(true);
          }}>
          <span className="text-lg font-semibold">Remove Connection</span>
        </button>
      }

      {
        <DeactivateInfoModal
          displayState={infoModalOpen}
          setDisplayState={hideModals}
          switchToInfoModal={openConfirmationModal}></DeactivateInfoModal>
      }

      {
        <DeactivateConfirmModal
          displayState={confirmModalOpen}
          setDisplayState={hideModals}
          deactivateCompany={deactivateCompany}></DeactivateConfirmModal>
      }

      {
        <DeactivateErrorModal
          displayState={errorModalOpen}
          setDisplayState={hideModals}></DeactivateErrorModal>
      }
    </>
  );
};
